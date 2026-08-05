"""Tests for the GameRegularUpdateSerializer."""

import pytest
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from games.models import GameLink
from games.serializers import GameRegularUpdateSerializer
from games.serializers.characters.character_link_write import MAX_LINKS
from games.tests.factories import GameFactory


class TestGameRegularUpdateSerializer(TestCase):
    """Tests for the GameRegularUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game instance for testing."""
        cls.game = GameFactory(
            name='Epic Quest',
            game_slug='epic-quest',
            description='An adventure in Middle Earth.',
        )

    def test_serializes_editable_fields(self):
        """Test that description is serialized."""
        data = GameRegularUpdateSerializer(self.game).data
        assert data['description'] == 'An adventure in Middle Earth.'

    def test_does_not_include_name(self):
        """Test that name is not exposed."""
        data = GameRegularUpdateSerializer(self.game).data
        assert 'name' not in data

    def test_all_fields_are_optional(self):
        """Test that a partial payload with a single field is valid."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'description': 'Updated lore.'}, partial=True
        )
        assert serializer.is_valid()

    def test_empty_payload_is_valid(self):
        """Test that an empty payload is valid since all fields are optional."""
        serializer = GameRegularUpdateSerializer(self.game, data={}, partial=True)
        assert serializer.is_valid()

    def test_update_applies_description(self):
        """Test that calling save updates the description field."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'description': 'New lore.'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.description == 'New lore.'

    def test_ignores_name_in_payload(self):
        """Test that a name entry in the payload is silently ignored."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'name': 'Renamed Quest'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Epic Quest'

    def test_game_slug_is_not_included(self):
        """Test that game_slug is not a field in the serializer."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'game_slug': 'hacked'}, partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.game_slug == 'epic-quest'


class TestGameRegularUpdateSerializerLinks(TestCase):
    """Tests for the writable `links` field on GameRegularUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.link = GameLink.objects.create(
            text='Official Wiki', url='http://example.com/wiki', game=cls.game,
        )

    def test_creates_new_link_without_id(self):
        """Test that an entry without an id creates a new GameLink."""
        serializer = GameRegularUpdateSerializer(
            self.game,
            data={'links': [{'text': 'Loot table', 'url': 'http://example.com/loot'}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.game.links.filter(url='http://example.com/loot').exists()

    def test_updates_existing_link_fields(self):
        """Test that an entry with an id updates the matching GameLink's fields."""
        serializer = GameRegularUpdateSerializer(
            self.game,
            data={
                'links': [
                    {
                        'id': self.link.id,
                        'text': 'Updated Wiki',
                        'url': 'http://example.com/updated',
                        'link_type': GameLink.LINK_TYPE_LOOTSTUDIO,
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
        assert self.link.link_type == GameLink.LINK_TYPE_LOOTSTUDIO

    def test_deletes_link_when_delete_true(self):
        """Test that an entry with delete=True removes the matching GameLink."""
        serializer = GameRegularUpdateSerializer(
            self.game,
            data={'links': [{'id': self.link.id, 'delete': True}]},
            partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert not GameLink.objects.filter(id=self.link.id).exists()

    def test_rejects_entry_without_url_when_not_deleting(self):
        """Test that a non-delete entry without a url produces a validation error."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'links': [{'text': 'Missing url'}]}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_omitting_links_leaves_existing_links_untouched(self):
        """Test that omitting the links field entirely does not delete existing links."""
        serializer = GameRegularUpdateSerializer(
            self.game, data={'description': 'New lore.'}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert GameLink.objects.filter(id=self.link.id).exists()

    def test_accepts_links_payload_at_max_cap(self):
        """Test that exactly MAX_LINKS entries is accepted."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS)]
        serializer = GameRegularUpdateSerializer(
            self.game, data={'links': payload}, partial=True,
        )
        assert serializer.is_valid()
        serializer.save()
        assert self.game.links.count() == MAX_LINKS + 1

    def test_rejects_links_payload_over_max_cap(self):
        """Test that more than MAX_LINKS entries is rejected with a 400 on links."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS + 1)]
        serializer = GameRegularUpdateSerializer(
            self.game, data={'links': payload}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_rolls_back_all_entries_when_one_entry_fails(self):
        """Test that a failing entry rolls back other entries applied in the same batch."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_link = GameLink.objects.create(
            text='Other link', url='http://example.com/other', game=other_game,
        )
        serializer = GameRegularUpdateSerializer(
            self.game,
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
        assert not self.game.links.filter(url='http://example.com/new').exists()
