"""Tests for GameRecipeWriteSerializer (issue #1446)."""

import pytest

from games.serializers import GameRecipeWriteSerializer
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory


@pytest.mark.django_db
class TestGameRecipeWriteSerializer:
    """Tests for the GameRecipeWriteSerializer allowlist and output validation."""

    def setup_method(self):
        """Set up a game with a visible and a hidden common item."""
        self.game = GameFactory(game_slug='test-game')
        self.other_game = GameFactory(game_slug='other-game')
        self.item = GameCommonItemFactory(game=self.game)
        self.hidden_item = GameCommonItemFactory(game=self.game, hidden=True)

    def _serializer(self, data, allow_hidden_output=False, **kwargs):
        """Build a write serializer bound to the test game."""
        context = {'game': self.game, 'allow_hidden_output': allow_hidden_output}
        return GameRecipeWriteSerializer(data=data, context=context, **kwargs)

    def test_fields_are_the_explicit_allowlist(self):
        """Test that only the allowlisted fields are exposed."""
        assert set(self._serializer({}).fields.keys()) == {
            'name', 'description', 'yield_quantity', 'crafting_time', 'crafting_cost',
            'ingredients', 'checks', 'hidden', 'game_common_item_id',
        }

    def test_ignores_game_and_id(self):
        """Test that `game` and `id` are dropped from validated data."""
        serializer = self._serializer({
            'name': 'Brew', 'game_common_item_id': self.item.id, 'id': 99,
            'game': self.other_game.id,
        })
        assert serializer.is_valid()
        assert 'id' not in serializer.validated_data
        assert 'game' not in serializer.validated_data

    def test_maps_output_id_to_common_item(self):
        """Test that game_common_item_id resolves to the game_common_item instance."""
        serializer = self._serializer({'name': 'Brew', 'game_common_item_id': self.item.id})
        assert serializer.is_valid()
        assert serializer.validated_data['game_common_item'] == self.item

    def test_rejects_hidden_output_without_game_edit(self):
        """Test that a hidden output item fails with does_not_exist on the regular tier."""
        serializer = self._serializer(
            {'name': 'Brew', 'game_common_item_id': self.hidden_item.id},
        )
        assert not serializer.is_valid()
        assert serializer.errors['game_common_item_id'][0].code == 'does_not_exist'

    def test_accepts_hidden_output_with_game_edit(self):
        """Test that a hidden output item is accepted when allow_hidden_output is set."""
        serializer = self._serializer(
            {'name': 'Brew', 'game_common_item_id': self.hidden_item.id},
            allow_hidden_output=True,
        )
        assert serializer.is_valid()

    def test_rejects_boolean_output_id(self):
        """Test that a boolean game_common_item_id fails with incorrect_type."""
        serializer = self._serializer({'name': 'Brew', 'game_common_item_id': True})
        assert not serializer.is_valid()
        assert serializer.errors['game_common_item_id'][0].code == 'incorrect_type'

    def test_partial_update_allows_missing_required_fields(self):
        """Test that a partial update does not require name or game_common_item_id."""
        recipe = GameRecipeFactory(game=self.game, game_common_item=self.item)
        serializer = GameRecipeWriteSerializer(
            recipe, data={'checks': 'DC 10'}, partial=True, context={'game': self.game},
        )
        assert serializer.is_valid()
