"""Tests for the character_item_fields fallback resolution helpers."""

from django.test import TestCase

from games.models import CharacterItemPhoto, GameItemPhoto
from games.serializers.games.items.character_item_fields import (
    resolve_character_item_field,
    resolve_character_item_photo_path,
)
from games.tests.factories import CharacterItemFactory, GameItemFactory


class TestResolveCharacterItemField(TestCase):
    """Tests for resolve_character_item_field."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game_item = GameItemFactory(name='Cloak of Elvenkind', description='Shimmering.')
        cls.character_item = CharacterItemFactory(game_item=cls.game_item)

    def test_returns_own_value_when_set(self):
        """Test that the character item's own field value is returned when not None."""
        self.character_item.name = "Frodo's Cloak"
        self.character_item.save()
        assert resolve_character_item_field(self.character_item, 'name') == "Frodo's Cloak"

    def test_falls_back_to_game_item_value_when_none(self):
        """Test that the game item's field value is returned when the override is None."""
        assert resolve_character_item_field(self.character_item, 'name') == 'Cloak of Elvenkind'

    def test_falls_back_for_description(self):
        """Test that description falls back to the game item's description when None."""
        assert resolve_character_item_field(self.character_item, 'description') == 'Shimmering.'


class TestResolveCharacterItemPhotoPath(TestCase):
    """Tests for resolve_character_item_photo_path."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game_item = GameItemFactory(name='Cloak of Elvenkind')
        cls.character_item = CharacterItemFactory(game_item=cls.game_item)

    def test_returns_none_when_neither_has_a_photo(self):
        """Test that None is returned when neither the character item nor game item has one."""
        assert resolve_character_item_photo_path(self.character_item) is None

    def test_falls_back_to_game_item_photo(self):
        """Test that the game item's photo path is used when the character item has none."""
        photo = GameItemPhoto.objects.create(
            game_item=self.game_item, path='photos/game_items/1/photo.png',
        )
        self.game_item.photo = photo
        self.game_item.save()
        assert (
            resolve_character_item_photo_path(self.character_item)
            == 'photos/game_items/1/photo.png'
        )

    def test_prefers_own_photo_over_game_item_photo(self):
        """Test that the character item's own photo path takes precedence."""
        game_photo = GameItemPhoto.objects.create(
            game_item=self.game_item, path='photos/game_items/1/photo.png',
        )
        self.game_item.photo = game_photo
        self.game_item.save()
        own_photo = CharacterItemPhoto.objects.create(
            character_item=self.character_item, path='photos/character_items/1/photo.png',
        )
        self.character_item.photo = own_photo
        self.character_item.save()
        assert (
            resolve_character_item_photo_path(self.character_item)
            == 'photos/character_items/1/photo.png'
        )
