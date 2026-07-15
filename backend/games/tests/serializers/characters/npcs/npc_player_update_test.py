"""Tests for the NpcPlayerUpdateSerializer."""

import pytest
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from games.models import CharacterLink
from games.serializers import NpcPlayerUpdateSerializer
from games.tests.factories import CharacterFactory, GameFactory


class TestNpcPlayerUpdateSerializer(TestCase):
    """Tests for the NpcPlayerUpdateSerializer's curated, player-writable NPC field set."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)

    def test_empty_payload_is_valid(self):
        """Test that an empty payload is valid since every field is optional."""
        serializer = NpcPlayerUpdateSerializer(self.npc, data={}, partial=True)
        assert serializer.is_valid()

    def test_public_description_is_writable(self):
        """Test that a `public_description`-only payload is applied."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'public_description': 'A wandering wizard.'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.public_description == 'A wandering wizard.'

    def test_allegiance_is_writable(self):
        """Test that an `allegiance`-only payload writes `public_allegiance`."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'allegiance': 'enemy'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.public_allegiance == 'enemy'
        assert updated.allegiance == 'neutral'

    def test_invalid_allegiance_is_rejected(self):
        """Test that an unknown allegiance choice produces a validation error."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'allegiance': 'unknown'}, partial=True
        )
        assert not serializer.is_valid()
        assert 'allegiance' in serializer.errors

    def test_slain_is_writable(self):
        """Test that a `slain`-only payload writes `public_slain`, leaving `slain` untouched."""
        serializer = NpcPlayerUpdateSerializer(self.npc, data={'slain': True}, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.public_slain is True
        assert updated.slain is False

    def test_combined_payload_updates_every_field(self):
        """Test that a payload combining every field applies all of them together."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc,
            data={
                'public_description': 'A wandering wizard.',
                'allegiance': 'ally',
                'slain': True,
                'links': [{'text': 'Official Wiki', 'url': 'http://example.com/wiki'}],
            },
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.public_description == 'A wandering wizard.'
        assert updated.public_allegiance == 'ally'
        assert updated.public_slain is True
        assert updated.links.filter(url='http://example.com/wiki').exists()

    def test_name_is_not_writable(self):
        """Test that `name` is silently ignored, never written to the model."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'name': 'Saruman'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Gandalf'

    def test_role_is_not_writable(self):
        """Test that `role` is silently ignored, never written to the model."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'role': 'Wizard'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.role is None

    def test_money_is_not_writable(self):
        """Test that `money` is silently ignored, never written to the model."""
        serializer = NpcPlayerUpdateSerializer(self.npc, data={'money': 999}, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.money == 0

    def test_private_description_is_not_writable(self):
        """Test that `private_description` is silently ignored, never written to the model."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'private_description': 'Secretly Saruman.'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.private_description == ''

    def test_real_slain_is_not_writable(self):
        """Test that the real `slain` field cannot be set through this serializer."""
        serializer = NpcPlayerUpdateSerializer(self.npc, data={'slain': True}, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.slain is False

    def test_real_allegiance_is_not_writable(self):
        """Test that the real `allegiance` field cannot be set through this serializer."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'allegiance': 'enemy'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.allegiance == 'neutral'


class TestNpcPlayerUpdateSerializerLinks(TestCase):
    """Tests for the writable `links` field on NpcPlayerUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.npc = CharacterFactory(name='Gandalf', game=cls.game, npc=True)
        cls.link = CharacterLink.objects.create(
            text='Official Wiki', url='http://example.com/wiki', character=cls.npc,
        )

    def test_creates_new_link_without_id(self):
        """Test that an entry without an id creates a new CharacterLink."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc,
            data={'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.npc.links.filter(url='http://example.com/loot').exists()

    def test_updates_existing_link_fields(self):
        """Test that an entry with an id updates the matching CharacterLink's fields."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc,
            data={'links': [{'id': self.link.id, 'text': 'Updated Wiki'}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        self.link.refresh_from_db()
        assert self.link.text == 'Updated Wiki'

    def test_deletes_link_when_delete_true(self):
        """Test that an entry with delete=True removes the matching CharacterLink."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc,
            data={'links': [{'id': self.link.id, 'delete': True}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert not CharacterLink.objects.filter(id=self.link.id).exists()

    def test_rejects_id_belonging_to_another_character(self):
        """Test that a link id belonging to a different character cannot be updated."""
        other_npc = CharacterFactory(name='Saruman', game=self.game, npc=True)
        other_link = CharacterLink.objects.create(
            text='Other link', url='http://example.com/other', character=other_npc,
        )
        serializer = NpcPlayerUpdateSerializer(
            self.npc,
            data={'links': [{'id': other_link.id, 'text': 'Hijacked'}]},
            partial=True,
        )
        assert serializer.is_valid()
        with pytest.raises(ValidationError):
            serializer.save()
        other_link.refresh_from_db()
        assert other_link.text == 'Other link'

    def test_omitting_links_leaves_existing_links_untouched(self):
        """Test that omitting the links field entirely does not delete existing links."""
        serializer = NpcPlayerUpdateSerializer(
            self.npc, data={'public_description': 'A wandering wizard.'}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert CharacterLink.objects.filter(id=self.link.id).exists()
