"""Tests for CharacterEditorCache."""

import pytest

from games.caches import CharacterEditorCache
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestCharacterEditorCachePc:
    """Tests for CharacterEditorCache.is_editor() on a PC."""

    def setup_method(self):
        """Set up a game, a DM, an owning player, a PC, and clear the shared memory cache."""
        memory_cache.clear()
        self.game = GameFactory()
        self.dm_user = UserFactory()
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.owner = UserFactory()
        self.player = PlayerFactory(game=self.game, user=self.owner)
        self.character = CharacterFactory(game=self.game, player=self.player, npc=False)
        self.outsider = UserFactory()

    def test_returns_true_for_the_owning_player(self):
        """Test that the PC's owning player is reported as an editor."""
        assert CharacterEditorCache.is_editor(self.character, self.owner) is True

    def test_returns_true_for_the_dm(self):
        """Test that a DM of the game is reported as an editor."""
        assert CharacterEditorCache.is_editor(self.character, self.dm_user) is True

    def test_returns_false_for_an_outsider(self):
        """Test that an unrelated user is reported as not an editor."""
        assert CharacterEditorCache.is_editor(self.character, self.outsider) is False

    def test_populates_the_pc_cache_type_on_miss(self):
        """Test that a cache miss stores the result under the PC cache type."""
        CharacterEditorCache.is_editor(self.character, self.owner)
        key = (self.owner.id, self.character.id)
        assert memory_cache.get(CharacterEditorCache.PC_CACHE_TYPE, key) is True

    def test_serves_from_cache_on_hit_even_after_ownership_changes(self):
        """Test that a cached result is served without re-checking live ownership."""
        assert CharacterEditorCache.is_editor(self.character, self.owner) is True

        self.character.player = None
        self.character.save()

        assert CharacterEditorCache.is_editor(self.character, self.owner) is True


@pytest.mark.django_db
class TestCharacterEditorCacheNpc:
    """Tests for CharacterEditorCache.is_editor() on an NPC."""

    def setup_method(self):
        """Set up a game, a DM, an NPC, and clear the shared memory cache."""
        memory_cache.clear()
        self.game = GameFactory()
        self.dm_user = UserFactory()
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.npc = CharacterFactory(game=self.game, npc=True)
        self.outsider = UserFactory()

    def test_returns_true_for_the_dm(self):
        """Test that a DM of the game is reported as an editor of the NPC."""
        assert CharacterEditorCache.is_editor(self.npc, self.dm_user) is True

    def test_returns_false_for_an_outsider(self):
        """Test that an unrelated user is reported as not an editor of the NPC."""
        assert CharacterEditorCache.is_editor(self.npc, self.outsider) is False

    def test_populates_the_npc_cache_type_on_miss(self):
        """Test that a cache miss stores the result under the NPC cache type."""
        CharacterEditorCache.is_editor(self.npc, self.dm_user)
        key = (self.dm_user.id, self.npc.id)
        assert memory_cache.get(CharacterEditorCache.NPC_CACHE_TYPE, key) is True

    def test_pc_and_npc_cache_types_are_independent(self):
        """Test that a PC and an NPC editor check use distinct cache types."""
        CharacterEditorCache.is_editor(self.npc, self.dm_user)
        pc_key = (self.dm_user.id, self.npc.id)
        assert memory_cache.get(CharacterEditorCache.PC_CACHE_TYPE, pc_key) is None
