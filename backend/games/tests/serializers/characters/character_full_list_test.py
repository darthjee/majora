"""Tests for the CharacterFullListSerializer."""

from django.test import TestCase

from games.models import CharacterTreasure
from games.serializers import CharacterFullListSerializer
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory


class TestCharacterFullListSerializer(TestCase):
    """Tests for the CharacterFullListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)

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

    def test_serializes_slain_from_real_field(self):
        """Test that slain is sourced from the real slain field, not public."""
        self.character.slain = True
        self.character.public_slain = False
        self.character.save()
        data = CharacterFullListSerializer(self.character).data
        assert data['slain'] is True

    def test_serializes_public_slain(self):
        """Test that public_slain is also exposed separately."""
        self.character.slain = True
        self.character.public_slain = False
        self.character.save()
        data = CharacterFullListSerializer(self.character).data
        assert data['public_slain'] is False

    def test_serializes_hidden(self):
        """Test that hidden is serialized."""
        self.character.hidden = True
        self.character.save()
        data = CharacterFullListSerializer(self.character).data
        assert data['hidden'] is True

    def test_serializes_treasure_value_summed_across_treasures(self):
        """Test that treasure_value sums total_value across the character's treasure rows."""
        treasure_one = TreasureFactory(name='Potion', value=50)
        treasure_two = TreasureFactory(name='Sword', value=100)
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_one, quantity=2, total_value=100,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=treasure_two, quantity=1, total_value=100,
        )
        data = CharacterFullListSerializer(self.character).data
        assert data['treasure_value'] == 200
