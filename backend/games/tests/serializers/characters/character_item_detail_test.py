"""Tests for the CharacterItemDetailSerializer/CharacterItemDetailAllSerializer."""

from django.test import TestCase

from games.models import CharacterItem
from games.serializers import CharacterItemDetailAllSerializer, CharacterItemDetailSerializer
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


class TestCharacterItemDetailSerializer(TestCase):
    """Tests for the CharacterItemDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_item = GameItemFactory(
            game=cls.game, name='Cloak of Elvenkind', description='A shimmering cloak.',
        )
        cls.character_item = CharacterItem.objects.create(
            character=cls.character, game_item=cls.game_item,
        )

    def test_description_falls_back_to_game_item_description(self):
        """Test that description falls back to the game item's description when not overridden."""
        data = CharacterItemDetailSerializer(self.character_item).data
        assert data['description'] == 'A shimmering cloak.'

    def test_description_uses_own_override_when_set(self):
        """Test that description uses the character item's own override when set."""
        self.character_item.description = 'Slightly frayed.'
        self.character_item.save()
        data = CharacterItemDetailSerializer(self.character_item).data
        assert data['description'] == 'Slightly frayed.'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = CharacterItemDetailSerializer(self.character_item).data
        assert set(data.keys()) == {'id', 'game_item_id', 'name', 'description', 'photo_path'}


class TestCharacterItemDetailAllSerializer(TestCase):
    """Tests for the CharacterItemDetailAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.game_item = GameItemFactory(
            game=cls.game, name='Cloak of Elvenkind', description='A shimmering cloak.',
        )
        cls.character_item = CharacterItem.objects.create(
            character=cls.character, game_item=cls.game_item,
        )

    def test_includes_hidden_field_alongside_detail_fields(self):
        """Test that the serializer exposes every detail field plus hidden."""
        data = CharacterItemDetailAllSerializer(self.character_item).data
        assert set(data.keys()) == {
            'id', 'game_item_id', 'name', 'description', 'photo_path', 'hidden',
        }

    def test_hidden_reflects_the_character_item_own_field(self):
        """Test that hidden reflects the character item's own hidden field."""
        self.character_item.hidden = True
        self.character_item.save()
        data = CharacterItemDetailAllSerializer(self.character_item).data
        assert data['hidden'] is True
