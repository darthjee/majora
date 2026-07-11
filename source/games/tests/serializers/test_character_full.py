"""Tests for the CharacterFullSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.serializers import CharacterFullSerializer
from games.tests.factories import CharacterFactory, GameFactory


@pytest.mark.django_db
class TestCharacterFullSerializer:
    """Tests for the CharacterFullSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(
            name='Frodo',
            game=self.game,
            public_description='A brave hobbit.',
            private_description='Secretly carries the ring.',
        )
        self.factory = APIRequestFactory()

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
        expected_fields = ['id', 'role', 'is_pc', 'photos', 'links', 'game_slug',
                           'can_edit', 'money']
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
