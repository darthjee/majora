"""Tests for the accounts signal receivers revoking API tokens on game deletion."""

import pytest

from accounts.models import ApiToken
from games.models import Game
from games.tests.factories import GameFactory, UserFactory


@pytest.mark.django_db
class TestGameDeletionTokenRevocation:
    """Tests that deleting games never widens a game-restricted token."""

    def setup_method(self):
        """Set up two games and a user owning API tokens."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.game = GameFactory(game_slug='first-game')
        self.other_game = GameFactory(game_slug='second-game')

    def _token(self, games):
        """Return a new token restricted to `games` (empty: every game)."""
        api_token, _ = ApiToken.objects.create_token(self.user, 'automation', [], games=games)
        return api_token

    def _exists(self, api_token):
        """Return whether `api_token` still exists."""
        return ApiToken.objects.filter(pk=api_token.pk).exists()

    def test_deleting_only_game_revokes_token(self):
        """Test that deleting a token's only game deletes the token."""
        api_token = self._token([self.game])
        self.game.delete()
        assert not self._exists(api_token)

    def test_deleting_one_of_two_games_keeps_token(self):
        """Test that deleting one of two games keeps the token on the remaining game."""
        api_token = self._token([self.game, self.other_game])
        self.game.delete()
        assert self._exists(api_token)
        assert list(api_token.games.all()) == [self.other_game]

    def test_queryset_delete_of_all_games_revokes_token(self):
        """Test that deleting all of a token's games in one queryset delete revokes it."""
        api_token = self._token([self.game, self.other_game])
        Game.objects.filter(pk__in=[self.game.pk, self.other_game.pk]).delete()
        assert not self._exists(api_token)

    def test_unrestricted_token_is_kept(self):
        """Test that deleting a game keeps a token allowed on every game."""
        api_token = self._token([])
        self.game.delete()
        assert self._exists(api_token)

    def test_token_on_other_game_is_kept(self):
        """Test that deleting a game keeps a token restricted to another game."""
        api_token = self._token([self.other_game])
        self.game.delete()
        assert self._exists(api_token)
