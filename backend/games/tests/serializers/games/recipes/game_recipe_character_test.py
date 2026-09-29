"""Tests for the GameRecipe → characters entry serializers."""

from django.test import TestCase

from games.serializers import GameRecipeCharacterAllSerializer, GameRecipeCharacterSerializer
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameFactory,
    GameRecipeFactory,
)


class TestGameRecipeCharacterSerializer(TestCase):
    """Tests for the GameRecipeCharacterSerializer and its all variant."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory()
        cls.game_recipe = GameRecipeFactory(game=cls.game)
        cls.npc = CharacterFactory(game=cls.game, name='Gandalf', npc=True)
        cls.pc = CharacterFactory(game=cls.game, name='Frodo', npc=False)
        cls.npc_recipe = CharacterRecipeFactory(
            character=cls.npc, game_recipe=cls.game_recipe, hidden=True,
        )
        cls.pc_recipe = CharacterRecipeFactory(character=cls.pc, game_recipe=cls.game_recipe)

    def test_only_exposes_expected_fields(self):
        """Test that the plain entry exposes only character fields (no hidden)."""
        data = GameRecipeCharacterSerializer(self.npc_recipe).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'type'}

    def test_id_is_the_character_id(self):
        """Test that the entry id is the character id, not the CharacterRecipe row id."""
        data = GameRecipeCharacterSerializer(self.npc_recipe).data
        assert data['id'] == self.npc.id
        assert data['name'] == 'Gandalf'

    def test_type_distinguishes_pc_and_npc(self):
        """Test that type is 'npc' for NPCs and 'pc' for PCs."""
        assert GameRecipeCharacterSerializer(self.npc_recipe).data['type'] == 'npc'
        assert GameRecipeCharacterSerializer(self.pc_recipe).data['type'] == 'pc'

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the character has no photo."""
        assert GameRecipeCharacterSerializer(self.pc_recipe).data['photo_path'] is None

    def test_all_variant_adds_character_recipe_hidden(self):
        """Test that the all variant adds hidden from the CharacterRecipe row."""
        data = GameRecipeCharacterAllSerializer(self.npc_recipe).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'type', 'hidden'}
        assert data['hidden'] is True
        assert GameRecipeCharacterAllSerializer(self.pc_recipe).data['hidden'] is False
