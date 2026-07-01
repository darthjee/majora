"""Tests for the GameUpdateSerializer."""

import pytest

from games.models import Game
from games.serializers import GameUpdateSerializer


@pytest.mark.django_db
class TestGameUpdateSerializer:
    """Tests for GameUpdateSerializer."""

    def setup_method(self):
        """Set up a game instance for testing."""
        self.game = Game.objects.create(
            name='Epic Quest',
            game_slug='epic-quest',
            photo='http://example.com/cover.png',
            description='An adventure in Middle Earth.',
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = GameUpdateSerializer(self.game, data={'name': 'New Quest'}, partial=True)
        assert serializer.is_valid()
        game = serializer.save()
        assert game.name == 'New Quest'

    def test_valid_partial_photo_update(self):
        """Test that a partial update with only photo is valid."""
        serializer = GameUpdateSerializer(
            self.game, data={'photo': 'http://example.com/new.png'}, partial=True
        )
        assert serializer.is_valid()
        game = serializer.save()
        assert game.photo == 'http://example.com/new.png'

    def test_valid_partial_description_update(self):
        """Test that a partial update with only description is valid."""
        serializer = GameUpdateSerializer(
            self.game, data={'description': 'Updated lore.'}, partial=True
        )
        assert serializer.is_valid()
        game = serializer.save()
        assert game.description == 'Updated lore.'

    def test_game_slug_is_not_included(self):
        """Test that game_slug is not a field in the serializer."""
        serializer = GameUpdateSerializer(self.game, data={'game_slug': 'hacked'}, partial=True)
        assert serializer.is_valid()
        game = serializer.save()
        assert game.game_slug == 'epic-quest'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameUpdateSerializer(self.game, data={}, partial=True)
        assert serializer.is_valid()

    def test_invalid_photo_url(self):
        """Test that an invalid URL for photo is rejected."""
        serializer = GameUpdateSerializer(
            self.game, data={'photo': 'not-a-url'}, partial=True
        )
        assert not serializer.is_valid()
        assert 'photo' in serializer.errors
