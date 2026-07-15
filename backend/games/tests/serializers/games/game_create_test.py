"""Tests for the GameCreateSerializer."""

import pytest

from games.models import Game
from games.serializers import GameCreateSerializer


@pytest.mark.django_db
class TestGameCreateSerializer:
    """Tests for GameCreateSerializer."""

    def test_valid_name_only(self):
        """Test that only name is required to create a game."""
        serializer = GameCreateSerializer(data={'name': 'My Campaign'})
        assert serializer.is_valid()

    def test_creates_game_with_name(self):
        """Test that saving the serializer creates a Game instance."""
        serializer = GameCreateSerializer(data={'name': 'Epic Quest'})
        assert serializer.is_valid()
        game = serializer.save()
        assert isinstance(game, Game)
        assert game.name == 'Epic Quest'

    def test_game_slug_is_auto_generated(self):
        """Test that game_slug is generated from name on save."""
        serializer = GameCreateSerializer(data={'name': 'My Epic Campaign'})
        assert serializer.is_valid()
        game = serializer.save()
        assert game.game_slug == 'my-epic-campaign'

    def test_name_is_required(self):
        """Test that missing name makes the serializer invalid."""
        serializer = GameCreateSerializer(data={'description': 'No name'})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_description_is_optional(self):
        """Test that omitting description is valid."""
        serializer = GameCreateSerializer(data={'name': 'No Desc Game'})
        assert serializer.is_valid()

    def test_description_is_accepted(self):
        """Test that a description string is accepted."""
        serializer = GameCreateSerializer(
            data={'name': 'Described Game', 'description': 'Some lore.'}
        )
        assert serializer.is_valid()
        game = serializer.save()
        assert game.description == 'Some lore.'

    def test_game_slug_not_in_fields(self):
        """Test that game_slug is not an exposed field on the serializer."""
        serializer = GameCreateSerializer(data={'name': 'Slug Test', 'game_slug': 'hacked-slug'})
        assert serializer.is_valid()
        game = serializer.save()
        assert game.game_slug != 'hacked-slug'

    def test_game_type_defaults_to_dnd_when_omitted(self):
        """Test that omitting game_type falls back to the model default 'dnd'."""
        serializer = GameCreateSerializer(data={'name': 'No Type Game'})
        assert serializer.is_valid()
        game = serializer.save()
        assert game.game_type == Game.GAME_TYPE_DND

    def test_game_type_is_persisted_when_given(self):
        """Test that passing game_type='deadlands' persists it."""
        serializer = GameCreateSerializer(
            data={'name': 'Deadlands Game', 'game_type': 'deadlands'}
        )
        assert serializer.is_valid()
        game = serializer.save()
        assert game.game_type == Game.GAME_TYPE_DEADLANDS
