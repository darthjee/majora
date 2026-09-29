"""Shared role setup for the game recipe create/update view tests (issue #1446)."""

from rest_framework.authtoken.models import Token

from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class RecipeWriteSetupMixin:
    """Mixin building a game, its output items and a token per caller role."""

    def setup_recipe_world(self):
        """Set up a game, visible/hidden/other-game items and one token per role."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.item = GameCommonItemFactory(game=self.game, name='Potion')
        self.hidden_item = GameCommonItemFactory(game=self.game, name='Secret', hidden=True)
        self.other_item = GameCommonItemFactory(game=self.other_game, name='Foreign')
        self.tokens = {
            'player': self._player_token('player_user', is_dm=False),
            'dm': self._player_token('dm_user', is_dm=True),
            'staff': self._token(UserFactory(username='staff_user', is_staff=True)),
            'superuser': self._token(SuperUserFactory(username='admin')),
            'non_member': self._token(UserFactory(username='other')),
        }

    def _player_token(self, username, is_dm):
        """Create a player (or DM) of the game and return their token."""
        user = UserFactory(username=username)
        PlayerFactory(game=self.game, user=user, is_dm=is_dm, name=username)
        return self._token(user)

    def _token(self, user):
        """Return a new auth token for `user`."""
        return Token.objects.create(user=user)
