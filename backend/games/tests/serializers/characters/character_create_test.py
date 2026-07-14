"""Tests for the CharacterCreateSerializer."""

from django.test import TestCase

from games.models import CharacterLink
from games.serializers import CharacterCreateSerializer
from games.serializers.characters.character_link_write import MAX_LINKS
from games.tests.factories import GameFactory


class TestCharacterCreateSerializer(TestCase):
    """Tests for the CharacterCreateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

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

    def test_accepts_links_payload_at_max_cap(self):
        """Test that exactly MAX_LINKS entries is accepted."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS)]
        serializer = CharacterCreateSerializer(data={'name': 'Villain', 'links': payload})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == MAX_LINKS

    def test_rejects_links_payload_over_max_cap(self):
        """Test that more than MAX_LINKS entries is rejected with a 400 on links."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS + 1)]
        serializer = CharacterCreateSerializer(data={'name': 'Villain', 'links': payload})
        assert not serializer.is_valid()
        assert 'links' in serializer.errors
