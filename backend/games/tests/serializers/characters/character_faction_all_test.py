"""Tests for the CharacterFactionAllSerializer."""

from django.test import TestCase

from games.models import CharacterFaction
from games.serializers import CharacterFactionAllSerializer
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


class TestCharacterFactionAllSerializer(TestCase):
    """Tests for the CharacterFactionAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.game_faction = GameFactionFactory(game=cls.game, name='The Silver Hand')
        cls.character_faction = CharacterFaction.objects.create(
            character=cls.character, game_faction=cls.game_faction,
        )

    def test_includes_hidden_field_alongside_character_faction_fields(self):
        """Test that the serializer exposes every CharacterFactionSerializer field plus hidden."""
        data = CharacterFactionAllSerializer(self.character_faction).data
        assert set(data.keys()) == {'id', 'game_faction_id', 'name', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_character_faction_own_field(self):
        """Test that hidden reflects the character faction's own hidden field."""
        self.character_faction.hidden = True
        self.character_faction.save()
        data = CharacterFactionAllSerializer(self.character_faction).data
        assert data['hidden'] is True

    def test_hidden_defaults_to_false(self):
        """Test that hidden defaults to False when not set."""
        data = CharacterFactionAllSerializer(self.character_faction).data
        assert data['hidden'] is False
