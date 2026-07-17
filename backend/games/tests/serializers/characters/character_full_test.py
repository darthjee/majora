"""Tests for the CharacterFullSerializer."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.models import CharacterTreasure
from games.serializers import CharacterFullSerializer
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory


class TestCharacterFullSerializer(TestCase):
    """Tests for the CharacterFullSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(
            name='Frodo',
            game=cls.game,
            public_description='A brave hobbit.',
            private_description='Secretly carries the ring.',
        )
        cls.factory = APIRequestFactory()

    def _serialize(self):
        """Build an anonymous request and serialize the character."""
        request = self.factory.get('/')
        request.user = AnonymousUser()
        return CharacterFullSerializer(self.character, context={'request': request}).data

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = self._serialize()
        assert data['name'] == 'Frodo'

    def test_serializes_public_description(self):
        """Test that the public_description field is serialized."""
        data = self._serialize()
        assert data['public_description'] == 'A brave hobbit.'

    def test_serializes_private_description(self):
        """Test that the private_description field is included, unlike the detail serializer."""
        data = self._serialize()
        assert data['private_description'] == 'Secretly carries the ring.'

    def test_inherits_detail_fields(self):
        """Test that all CharacterDetailSerializer fields are still present."""
        data = self._serialize()
        expected_fields = ['id', 'role', 'is_pc', 'links', 'game_slug',
                           'can_edit', 'can_edit_money', 'money']
        for field in expected_fields:
            assert field in data

    def test_serializes_money(self):
        """Test that the money field is serialized."""
        self.character.money = 250
        self.character.save()
        data = self._serialize()
        assert data['money'] == 250

    def test_serializes_allegiance_from_real_field(self):
        """Test that allegiance is sourced from the real allegiance field, not public."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = self._serialize()
        assert data['allegiance'] == 'enemy'

    def test_serializes_public_allegiance(self):
        """Test that public_allegiance is also exposed separately."""
        self.character.allegiance = 'enemy'
        self.character.public_allegiance = 'ally'
        self.character.save()
        data = self._serialize()
        assert data['public_allegiance'] == 'ally'

    def test_serializes_slain_from_real_field(self):
        """Test that slain is sourced from the real slain field, not public."""
        self.character.slain = True
        self.character.public_slain = False
        self.character.save()
        data = self._serialize()
        assert data['slain'] is True

    def test_serializes_public_slain(self):
        """Test that public_slain is also exposed separately."""
        self.character.slain = True
        self.character.public_slain = False
        self.character.save()
        data = self._serialize()
        assert data['public_slain'] is False

    def test_serializes_hidden(self):
        """Test that hidden is serialized."""
        self.character.hidden = True
        self.character.save()
        data = self._serialize()
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
        data = self._serialize()
        assert data['treasure_value'] == 200
