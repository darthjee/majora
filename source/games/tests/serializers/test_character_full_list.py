"""Tests for the CharacterFullListSerializer."""

import pytest

from games.serializers import CharacterFullListSerializer
from games.tests.factories import CharacterFactory, GameFactory


@pytest.mark.django_db
class TestCharacterFullListSerializer:
    """Tests for the CharacterFullListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Frodo', game=self.game)

    def test_inherits_list_fields(self):
        """Test that all CharacterListSerializer fields are still present."""
        data = CharacterFullListSerializer(self.character).data
        expected_fields = ['id', 'name', 'game_slug', 'profile_photo_path', 'slain']
        for field in expected_fields:
            assert field in data

    def test_serializes_allegiance_from_real_field(self):
        """Test that allegiance is sourced from the real allegiance field, not public."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = CharacterFullListSerializer(self.character).data
        assert data['allegiance'] == 'enemy'

    def test_serializes_public_allegiance(self):
        """Test that public_allegiance is also exposed separately."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = CharacterFullListSerializer(self.character).data
        assert data['public_allegiance'] == 'ally'
