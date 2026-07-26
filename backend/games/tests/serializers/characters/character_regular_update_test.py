"""Tests for the CharacterRegularUpdateSerializer."""

import pytest
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from games.models import CharacterLink
from games.serializers import CharacterRegularUpdateSerializer
from games.serializers.characters.character_link_write import MAX_LINKS
from games.tests.factories import CharacterFactory, GameFactory


class TestCharacterRegularUpdateSerializer(TestCase):
    """Tests for the CharacterRegularUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=False)

    def test_serializes_editable_fields(self):
        """Test that all editable fields are serialized."""
        self.character.role = 'Hobbit'
        self.character.public_description = 'A brave hobbit.'
        self.character.save()
        data = CharacterRegularUpdateSerializer(self.character).data
        assert data['name'] == 'Frodo'
        assert data['role'] == 'Hobbit'
        assert data['public_description'] == 'A brave hobbit.'

    def test_does_not_include_private_description(self):
        """Test that private_description is not exposed."""
        data = CharacterRegularUpdateSerializer(self.character).data
        assert 'private_description' not in data

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed."""
        data = CharacterRegularUpdateSerializer(self.character).data
        assert 'hidden' not in data

    def test_does_not_include_allegiance_fields(self):
        """Test that private_allegiance and public_allegiance are not exposed."""
        data = CharacterRegularUpdateSerializer(self.character).data
        assert 'private_allegiance' not in data
        assert 'public_allegiance' not in data

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = CharacterRegularUpdateSerializer(self.character).data
        assert 'game' not in data

    def test_does_not_include_id(self):
        """Test that the id field is not exposed."""
        data = CharacterRegularUpdateSerializer(self.character).data
        assert 'id' not in data

    def test_all_fields_are_optional(self):
        """Test that a partial payload with a single field is valid."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'role': 'Hobbit'}, partial=True
        )
        assert serializer.is_valid()

    def test_empty_payload_is_valid(self):
        """Test that an empty payload is valid since all fields are optional."""
        serializer = CharacterRegularUpdateSerializer(self.character, data={}, partial=True)
        assert serializer.is_valid()

    def test_update_applies_only_provided_fields(self):
        """Test that calling save only updates the fields present in validated data."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'name': 'Samwise'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Samwise'
        assert updated.game == self.game

    def test_ignores_private_description_in_payload(self):
        """Test that a private_description entry in the payload is silently ignored."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'private_description': 'Secret notes'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.private_description != 'Secret notes'

    def test_ignores_hidden_in_payload(self):
        """Test that a hidden entry in the payload is silently ignored."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'hidden': True}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.hidden is False

    def test_money_field_is_writable(self):
        """Test that a valid money update is accepted and applied."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'money': 150}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.money == 150

    def test_negative_money_is_invalid(self):
        """Test that a negative money update produces a validation error on the money key."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'money': -1}, partial=True
        )
        assert not serializer.is_valid()
        assert 'money' in serializer.errors

    def test_name_over_max_length_is_invalid(self):
        """Test that a name over the max length produces a validation error on the name key."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'name': 'x' * 201}, partial=True
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_game_and_player_are_not_changed(self):
        """Test that game cannot be changed via update, even if supplied."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        serializer = CharacterRegularUpdateSerializer(
            self.character,
            data={'name': 'Samwise', 'game': other_game.id, 'game_id': other_game.id},
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Samwise'
        assert updated.game == self.game


class TestCharacterRegularUpdateSerializerLinks(TestCase):
    """Tests for the writable `links` field on CharacterRegularUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=False)
        cls.link = CharacterLink.objects.create(
            text='Official Wiki', url='http://example.com/wiki', character=cls.character,
        )

    def test_creates_new_link_without_id(self):
        """Test that an entry without an id creates a new CharacterLink."""
        serializer = CharacterRegularUpdateSerializer(
            self.character,
            data={'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.character.links.filter(url='http://example.com/loot').exists()

    def test_updates_existing_link_fields(self):
        """Test that an entry with an id updates the matching CharacterLink's fields."""
        serializer = CharacterRegularUpdateSerializer(
            self.character,
            data={
                'links': [
                    {
                        'id': self.link.id,
                        'text': 'Updated Wiki',
                        'url': 'http://example.com/updated',
                        'link_type': CharacterLink.LINK_TYPE_LOOTSTUDIO,
                    }
                ]
            },
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        self.link.refresh_from_db()
        assert self.link.text == 'Updated Wiki'
        assert self.link.url == 'http://example.com/updated'
        assert self.link.link_type == CharacterLink.LINK_TYPE_LOOTSTUDIO

    def test_deletes_link_when_delete_true(self):
        """Test that an entry with delete=True removes the matching CharacterLink."""
        serializer = CharacterRegularUpdateSerializer(
            self.character,
            data={'links': [{'id': self.link.id, 'delete': True}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert not CharacterLink.objects.filter(id=self.link.id).exists()

    def test_rejects_entry_without_url_when_not_deleting(self):
        """Test that a non-delete entry without a url produces a validation error."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'links': [{'text': 'Missing url'}]}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_omitting_links_leaves_existing_links_untouched(self):
        """Test that omitting the links field entirely does not delete existing links."""
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'name': 'Samwise'}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert CharacterLink.objects.filter(id=self.link.id).exists()

    def test_accepts_links_payload_at_max_cap(self):
        """Test that exactly MAX_LINKS entries is accepted."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS)]
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'links': payload}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.character.links.count() == MAX_LINKS + 1

    def test_rejects_links_payload_over_max_cap(self):
        """Test that more than MAX_LINKS entries is rejected with a 400 on links."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS + 1)]
        serializer = CharacterRegularUpdateSerializer(
            self.character, data={'links': payload}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_rolls_back_all_entries_when_one_entry_fails(self):
        """Test that a failing entry rolls back other entries applied in the same batch."""
        other_character = CharacterFactory(name='Sam', game=self.game, npc=False)
        other_link = CharacterLink.objects.create(
            text='Other link', url='http://example.com/other', character=other_character,
        )
        serializer = CharacterRegularUpdateSerializer(
            self.character,
            data={
                'links': [
                    {'text': 'New link', 'url': 'http://example.com/new'},
                    {'id': other_link.id, 'text': 'Hijacked'},
                ]
            },
            partial=True,
        )
        assert serializer.is_valid()
        with pytest.raises(ValidationError):
            serializer.save()
        assert not self.character.links.filter(url='http://example.com/new').exists()
