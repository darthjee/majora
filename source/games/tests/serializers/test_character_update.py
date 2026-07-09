"""Tests for the CharacterUpdateSerializer."""

import pytest
from rest_framework.exceptions import ValidationError

from games.models import CharacterLink
from games.serializers import CharacterUpdateSerializer
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory


@pytest.mark.django_db
class TestCharacterUpdateSerializer:
    """Tests for the CharacterUpdateSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Frodo', game=self.game)

    def test_serializes_editable_fields(self):
        """Test that all editable fields are serialized."""
        self.character.role = 'Hobbit'
        self.character.public_description = 'A brave hobbit.'
        self.character.private_description = 'Secretly carries the ring.'
        self.character.save()
        data = CharacterUpdateSerializer(self.character).data
        assert data['name'] == 'Frodo'
        assert data['role'] == 'Hobbit'
        assert data['public_description'] == 'A brave hobbit.'
        assert data['private_description'] == 'Secretly carries the ring.'

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = CharacterUpdateSerializer(self.character).data
        assert 'game' not in data

    def test_does_not_include_id(self):
        """Test that the id field is not exposed."""
        data = CharacterUpdateSerializer(self.character).data
        assert 'id' not in data

    def test_all_fields_are_optional(self):
        """Test that a partial payload with a single field is valid."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'role': 'Hobbit'}, partial=True
        )
        assert serializer.is_valid()

    def test_empty_payload_is_valid(self):
        """Test that an empty payload is valid since all fields are optional."""
        serializer = CharacterUpdateSerializer(self.character, data={}, partial=True)
        assert serializer.is_valid()

    def test_update_applies_only_provided_fields(self):
        """Test that calling save only updates the fields present in validated data."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'name': 'Samwise'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Samwise'
        assert updated.game == self.game

    def test_hidden_field_is_writable(self):
        """Test that the hidden field is included and writable."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'hidden': True}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.hidden is True

    def test_hidden_field_defaults_to_false(self):
        """Test that hidden is False by default and serialized correctly."""
        data = CharacterUpdateSerializer(self.character).data
        assert data['hidden'] is False

    def test_money_field_is_writable(self):
        """Test that a valid money update is accepted and applied."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'money': 150}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.money == 150

    def test_money_field_defaults_to_zero(self):
        """Test that money is 0 by default and serialized correctly."""
        data = CharacterUpdateSerializer(self.character).data
        assert data['money'] == 0

    def test_negative_money_is_invalid(self):
        """Test that a negative money update produces a validation error on the money key."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'money': -1}, partial=True
        )
        assert not serializer.is_valid()
        assert 'money' in serializer.errors

    def test_name_over_max_length_is_invalid(self):
        """Test that a name over the max length produces a validation error on the name key."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'name': 'x' * 201}, partial=True
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_allegiance_field_is_writable(self):
        """Test that the allegiance field is included and writable."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'allegiance': 'enemy'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.allegiance == 'enemy'

    def test_allegiance_field_defaults_to_neutral(self):
        """Test that allegiance is 'neutral' by default and serialized correctly."""
        data = CharacterUpdateSerializer(self.character).data
        assert data['allegiance'] == 'neutral'

    def test_public_allegiance_field_is_writable(self):
        """Test that the public_allegiance field is included and writable."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'public_allegiance': 'ally'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.public_allegiance == 'ally'

    def test_public_allegiance_field_defaults_to_neutral(self):
        """Test that public_allegiance is 'neutral' by default and serialized correctly."""
        data = CharacterUpdateSerializer(self.character).data
        assert data['public_allegiance'] == 'neutral'

    def test_game_and_player_are_not_changed(self):
        """Test that game and player cannot be changed via update, even if supplied."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_player = PlayerFactory(name='Other Player')
        serializer = CharacterUpdateSerializer(
            self.character,
            data={
                'name': 'Samwise',
                'game': other_game.id,
                'game_id': other_game.id,
                'player': other_player.id,
                'player_id': other_player.id,
            },
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Samwise'
        assert updated.game == self.game
        assert updated.player is None


@pytest.mark.django_db
class TestCharacterUpdateSerializerLinks:
    """Tests for the writable `links` field on CharacterUpdateSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Frodo', game=self.game)
        self.link = CharacterLink.objects.create(
            text='Official Wiki', url='http://example.com/wiki', character=self.character,
        )

    def test_creates_new_link_without_id(self):
        """Test that an entry without an id creates a new CharacterLink."""
        serializer = CharacterUpdateSerializer(
            self.character,
            data={'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.character.links.filter(url='http://example.com/loot').exists()

    def test_updates_existing_link_fields(self):
        """Test that an entry with an id updates the matching CharacterLink's fields."""
        serializer = CharacterUpdateSerializer(
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
        serializer = CharacterUpdateSerializer(
            self.character,
            data={'links': [{'id': self.link.id, 'delete': True}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert not CharacterLink.objects.filter(id=self.link.id).exists()

    def test_rejects_entry_without_url_when_not_deleting(self):
        """Test that a non-delete entry without a url produces a validation error."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'links': [{'text': 'Missing url'}]}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_rejects_id_belonging_to_another_character(self):
        """Test that a link id belonging to a different character cannot be updated."""
        other_character = CharacterFactory(name='Sam', game=self.game)
        other_link = CharacterLink.objects.create(
            text='Other link', url='http://example.com/other', character=other_character,
        )
        serializer = CharacterUpdateSerializer(
            self.character,
            data={'links': [{'id': other_link.id, 'text': 'Hijacked'}]},
            partial=True,
        )
        assert serializer.is_valid()
        with pytest.raises(ValidationError):
            serializer.save()
        other_link.refresh_from_db()
        assert other_link.text == 'Other link'

    def test_rejects_deleting_id_belonging_to_another_character(self):
        """Test that a link id belonging to a different character cannot be deleted."""
        other_character = CharacterFactory(name='Sam', game=self.game)
        other_link = CharacterLink.objects.create(
            text='Other link', url='http://example.com/other', character=other_character,
        )
        serializer = CharacterUpdateSerializer(
            self.character,
            data={'links': [{'id': other_link.id, 'delete': True}]},
            partial=True,
        )
        assert serializer.is_valid()
        with pytest.raises(ValidationError):
            serializer.save()
        assert CharacterLink.objects.filter(id=other_link.id).exists()

    def test_omitting_links_leaves_existing_links_untouched(self):
        """Test that omitting the links field entirely does not delete existing links."""
        serializer = CharacterUpdateSerializer(
            self.character, data={'name': 'Samwise'}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert CharacterLink.objects.filter(id=self.link.id).exists()
