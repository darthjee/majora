"""Tests for the reachable-games helpers in accounts.api_tokens."""

import pytest

from accounts.api_tokens import reachable_games, reaches_all_games
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestReachableGames:
    """Tests for reachable_games() and reaches_all_games()."""

    def setup_method(self):
        """Set up a game, another game and a user."""
        self.game = GameFactory(name='Alpha', game_slug='alpha')
        self.other_game = GameFactory(name='Beta', game_slug='beta')
        self.user = UserFactory()

    def test_dm_reaches_game(self):
        """Test that a DM reaches their game."""
        PlayerFactory(game=self.game, user=self.user, is_dm=True)
        assert list(reachable_games(self.user)) == [self.game]

    def test_player_reaches_game(self):
        """Test that a plain player reaches their game."""
        PlayerFactory(game=self.game, user=self.user)
        assert list(reachable_games(self.user)) == [self.game]

    def test_pc_owner_reaches_game(self):
        """Test that a PC owner reaches the PC's game."""
        player = PlayerFactory(game=self.game, user=self.user)
        CharacterFactory(game=self.game, player=player, npc=False)
        assert list(reachable_games(self.user)) == [self.game]

    def test_non_member_reaches_nothing(self):
        """Test that a non-member reaches no game."""
        PlayerFactory(game=self.game, user=UserFactory())
        assert list(reachable_games(self.user)) == []

    def test_superuser_reaches_every_game(self):
        """Test that a superuser reaches every game."""
        superuser = SuperUserFactory()
        assert set(reachable_games(superuser)) == {self.game, self.other_game}

    def test_plain_staff_non_member_reaches_nothing(self):
        """Test that a plain staff user who is not a member reaches no game."""
        staff = UserFactory(is_staff=True)
        assert list(reachable_games(staff)) == []

    def test_reaches_all_games_for_superuser(self):
        """Test that reaches_all_games is true for a superuser."""
        assert reaches_all_games(SuperUserFactory()) is True

    def test_reaches_all_games_for_staff(self):
        """Test that reaches_all_games is false for plain staff."""
        assert reaches_all_games(UserFactory(is_staff=True)) is False
