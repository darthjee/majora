"""Tests for the CharacterItemSerializer."""

from django.test import TestCase

from games.models import CharacterItem, CharacterItemPhoto, GameItemPhoto
from games.serializers import CharacterItemSerializer
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


class TestCharacterItemSerializer(TestCase):
    """Tests for the CharacterItemSerializer."""

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

    def test_serializes_id(self):
        """Test that the id field is serialized as the CharacterItem row id."""
        data = CharacterItemSerializer(self.character_item).data
        assert data['id'] == self.character_item.id

    def test_serializes_game_item_id(self):
        """Test that game_item_id is sourced from the related game item's id."""
        data = CharacterItemSerializer(self.character_item).data
        assert data['game_item_id'] == self.game_item.id

    def test_name_falls_back_to_game_item_name(self):
        """Test that name falls back to the game item's name when not overridden."""
        data = CharacterItemSerializer(self.character_item).data
        assert data['name'] == 'Cloak of Elvenkind'

    def test_name_uses_own_override_when_set(self):
        """Test that name uses the character item's own override when set."""
        self.character_item.name = "Frodo's Cloak"
        self.character_item.save()
        data = CharacterItemSerializer(self.character_item).data
        assert data['name'] == "Frodo's Cloak"

    def test_description_falls_back_to_game_item_description(self):
        """Test that description falls back to the game item's description when not overridden."""
        data = CharacterItemSerializer(self.character_item).data
        assert data['description'] == 'A shimmering cloak.'

    def test_description_uses_own_override_when_set(self):
        """Test that description uses the character item's own override when set."""
        self.character_item.description = 'Slightly frayed.'
        self.character_item.save()
        data = CharacterItemSerializer(self.character_item).data
        assert data['description'] == 'Slightly frayed.'

    def test_photo_path_is_none_without_any_photo(self):
        """Test that photo_path is None when neither item has a photo."""
        data = CharacterItemSerializer(self.character_item).data
        assert data['photo_path'] is None

    def test_photo_path_falls_back_to_game_item_photo(self):
        """Test that photo_path falls back to the game item's photo when not overridden."""
        photo = GameItemPhoto.objects.create(
            game_item=self.game_item, path='photos/game_items/1/photo.png',
        )
        self.game_item.photo = photo
        self.game_item.save()
        data = CharacterItemSerializer(self.character_item).data
        assert data['photo_path'] == 'photos/game_items/1/photo.png'

    def test_photo_path_uses_own_override_when_set(self):
        """Test that photo_path uses the character item's own photo when set."""
        own_photo = CharacterItemPhoto.objects.create(
            character_item=self.character_item, path='photos/character_items/1/photo.png',
        )
        self.character_item.photo = own_photo
        self.character_item.save()
        data = CharacterItemSerializer(self.character_item).data
        assert data['photo_path'] == 'photos/character_items/1/photo.png'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = CharacterItemSerializer(self.character_item).data
        assert set(data.keys()) == {'id', 'game_item_id', 'name', 'description', 'photo_path'}

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterItemSerializer(self.character_item).data
        assert 'character' not in data

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = CharacterItemSerializer(self.character_item).data
        assert 'hidden' not in data
