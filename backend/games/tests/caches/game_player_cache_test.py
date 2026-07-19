"""Tests for GamePlayerCache."""

import pytest

from games.caches import GamePlayerCache
from games.tests.factories import GameFactory, PlayerFactory, UserFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestGamePlayerCache:
    """Tests for GamePlayerCache.has_player()."""

    def setup_method(self):
        """Set up a game, a DM, a player, and clear the shared memory cache."""
        memory_cache.clear()
        self.game = GameFactory()
        self.dm_user = UserFactory()
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player_user = UserFactory()
        PlayerFactory(game=self.game, user=self.player_user, is_dm=False)
        self.outsider = UserFactory()

    def test_returns_true_for_a_player(self):
        """Test that a game player is reported as a player."""
        assert GamePlayerCache.has_player(self.game, self.player_user) is True

    def test_returns_true_for_a_dm(self):
        """Test that a game DM is reported as a player."""
        assert GamePlayerCache.has_player(self.game, self.dm_user) is True

    def test_returns_false_for_an_outsider(self):
        """Test that an unrelated user is reported as not a player."""
        assert GamePlayerCache.has_player(self.game, self.outsider) is False

    def test_is_dm_filter_only_matches_the_dm(self):
        """Test that is_dm=True only matches an actual DM, not a regular player."""
        assert GamePlayerCache.has_player(self.game, self.dm_user, is_dm=True) is True
        assert GamePlayerCache.has_player(self.game, self.player_user, is_dm=True) is False

    def test_populates_the_cache_on_miss(self):
        """Test that a cache miss stores the result keyed by user id, game id, and is_dm."""
        GamePlayerCache.has_player(self.game, self.player_user)
        key = (self.player_user.id, self.game.id, None)
        assert memory_cache.get(GamePlayerCache.CACHE_TYPE, key) is True

    def test_serves_from_cache_on_hit_even_after_the_player_leaves(self):
        """Test that a cached result is served without re-checking the live player rows."""
        assert GamePlayerCache.has_player(self.game, self.player_user) is True

        self.game.players.filter(user=self.player_user).delete()

        assert GamePlayerCache.has_player(self.game, self.player_user) is True

    def test_different_is_dm_filters_are_cached_independently(self):
        """Test that has_player(is_dm=None) and has_player(is_dm=True) don't share a key."""
        assert GamePlayerCache.has_player(self.game, self.player_user, is_dm=True) is False
        assert GamePlayerCache.has_player(self.game, self.player_user) is True
