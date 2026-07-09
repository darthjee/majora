"""Tests for the CharacterCreateSerializer."""

import pytest

from games.models import CharacterLink
from games.serializers import CharacterCreateSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestCharacterCreateSerializer:
    """Tests for the CharacterCreateSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_creates_character_without_links(self):
        """Test that a character is created when no links are given."""
        serializer = CharacterCreateSerializer(data={'name': 'Villain'})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == 0

    def test_creates_links_from_initial_payload(self):
        """Test that each entry in the initial links array creates a CharacterLink."""
        serializer = CharacterCreateSerializer(
            data={
                'name': 'Villain',
                'links': [
                    {'text': 'Loot table', 'url': 'http://example.com/loot'},
                    {'url': 'http://example.com/wiki'},
                ],
            }
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == 2
        assert character.links.filter(url='http://example.com/loot').exists()
        assert character.links.filter(url='http://example.com/wiki').exists()

    def test_ignores_id_and_delete_on_create(self):
        """Test that id/delete on an initial link entry are ignored (a fresh link is created)."""
        serializer = CharacterCreateSerializer(
            data={
                'name': 'Villain',
                'links': [{'id': 999, 'delete': True, 'url': 'http://example.com/loot'}],
            }
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == 1
        link = character.links.first()
        assert link.id != 999
        assert CharacterLink.objects.filter(character=character).count() == 1

    def test_rejects_link_entry_without_url(self):
        """Test that an initial link entry without a url is invalid."""
        serializer = CharacterCreateSerializer(
            data={'name': 'Villain', 'links': [{'text': 'Missing url'}]}
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors
