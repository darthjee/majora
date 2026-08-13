"""Tests for the CharacterPossessionAllSerializer."""

from django.test import TestCase

from games.models import CharacterPossession
from games.serializers import CharacterPossessionAllSerializer
from games.tests.factories import CharacterFactory, GameFactory, GamePossessionFactory


class TestCharacterPossessionAllSerializer(TestCase):
    """Tests for the CharacterPossessionAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.game_possession = GamePossessionFactory(game=cls.game, name='Bag End')
        cls.character_possession = CharacterPossession.objects.create(
            character=cls.character, game_possession=cls.game_possession,
        )

    def test_includes_hidden_field_alongside_character_possession_fields(self):
        """Test that the serializer exposes every base field plus hidden."""
        data = CharacterPossessionAllSerializer(self.character_possession).data
        assert set(data.keys()) == {
            'id', 'game_possession_id', 'name', 'description', 'photo_path', 'hidden',
        }

    def test_hidden_reflects_the_character_possession_own_field(self):
        """Test that hidden reflects the character possession's own hidden field."""
        self.character_possession.hidden = True
        self.character_possession.save()
        data = CharacterPossessionAllSerializer(self.character_possession).data
        assert data['hidden'] is True

    def test_hidden_defaults_to_false(self):
        """Test that hidden defaults to False when not set."""
        data = CharacterPossessionAllSerializer(self.character_possession).data
        assert data['hidden'] is False
