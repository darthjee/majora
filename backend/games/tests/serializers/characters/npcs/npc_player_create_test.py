"""Tests for the NpcPlayerCreateSerializer."""

from django.test import TestCase

from games.models import CharacterLink
from games.serializers import NpcPlayerCreateSerializer
from games.serializers.characters.character_link_write import MAX_LINKS
from games.tests.factories import GameFactory


class TestNpcPlayerCreateSerializer(TestCase):
    """Tests for the NpcPlayerCreateSerializer's curated, player-writable NPC field set."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_name_is_required(self):
        """Test that omitting `name` produces a validation error."""
        serializer = NpcPlayerCreateSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_creates_character_with_name_only(self):
        """Test that a character is created when only `name` is given."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain'})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.name == 'Villain'
        assert character.game == self.game
        assert character.npc is True

    def test_role_is_writable(self):
        """Test that a `role` payload is applied."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'role': 'Antagonist'})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.role == 'Antagonist'

    def test_public_description_is_writable(self):
        """Test that a `public_description` payload is applied."""
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'public_description': 'A shady figure'}
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.public_description == 'A shady figure'

    def test_public_allegiance_is_writable(self):
        """Test that a `public_allegiance` payload writes `public_allegiance`."""
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'public_allegiance': 'enemy'}
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.public_allegiance == 'enemy'
        assert character.private_allegiance == 'neutral'

    def test_invalid_public_allegiance_is_rejected(self):
        """Test that an unknown public_allegiance choice produces a validation error."""
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'public_allegiance': 'unknown'}
        )
        assert not serializer.is_valid()
        assert 'public_allegiance' in serializer.errors

    def test_public_slain_is_writable(self):
        """Test that a `public_slain` payload writes it, leaving `private_slain` untouched."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'public_slain': True})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.public_slain is True
        assert character.private_slain is False

    def test_optional_fields_default_when_omitted(self):
        """Test that optional fields fall back to model defaults when omitted."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain'})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.role is None
        assert character.public_description == ''
        assert character.public_allegiance == 'neutral'
        assert character.public_slain is False

    def test_hidden_is_not_a_declared_field(self):
        """Test that `hidden` is not declared on the serializer at all."""
        assert 'hidden' not in NpcPlayerCreateSerializer().fields

    def test_hidden_in_payload_has_no_effect(self):
        """Test that a `hidden` key in the payload is silently ignored, with no effect."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'hidden': True})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.hidden is False

    def test_private_description_is_not_a_declared_field(self):
        """Test that `private_description` is not declared on the serializer at all."""
        assert 'private_description' not in NpcPlayerCreateSerializer().fields

    def test_private_description_in_payload_has_no_effect(self):
        """Test that a `private_description` key in the payload is silently ignored."""
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'private_description': 'Secretly a good person'}
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.private_description == ''

    def test_private_allegiance_is_not_a_declared_field(self):
        """Test that `private_allegiance` is not declared on the serializer at all."""
        assert 'private_allegiance' not in NpcPlayerCreateSerializer().fields

    def test_private_allegiance_in_payload_has_no_effect(self):
        """Test that a `private_allegiance` key in the payload is silently ignored."""
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'private_allegiance': 'ally'}
        )
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.private_allegiance == 'neutral'

    def test_money_is_not_a_declared_field(self):
        """Test that `money` is not declared on the serializer at all."""
        assert 'money' not in NpcPlayerCreateSerializer().fields

    def test_money_in_payload_has_no_effect(self):
        """Test that a `money` key in the payload is silently ignored, with no effect."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'money': 42})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.money == 0


class TestNpcPlayerCreateSerializerLinks(TestCase):
    """Tests for the writable `links` field on NpcPlayerCreateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_creates_character_without_links(self):
        """Test that a character is created when no links are given."""
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain'})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == 0

    def test_creates_links_from_initial_payload(self):
        """Test that each entry in the initial links array creates a CharacterLink."""
        serializer = NpcPlayerCreateSerializer(
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
        serializer = NpcPlayerCreateSerializer(
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
        serializer = NpcPlayerCreateSerializer(
            data={'name': 'Villain', 'links': [{'text': 'Missing url'}]}
        )
        assert not serializer.is_valid()
        assert 'links' in serializer.errors

    def test_accepts_links_payload_at_max_cap(self):
        """Test that exactly MAX_LINKS entries is accepted."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS)]
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'links': payload})
        assert serializer.is_valid()
        character = serializer.save(game=self.game, npc=True)
        assert character.links.count() == MAX_LINKS

    def test_rejects_links_payload_over_max_cap(self):
        """Test that more than MAX_LINKS entries is rejected with a 400 on links."""
        payload = [{'url': f'http://example.com/{i}'} for i in range(MAX_LINKS + 1)]
        serializer = NpcPlayerCreateSerializer(data={'name': 'Villain', 'links': payload})
        assert not serializer.is_valid()
        assert 'links' in serializer.errors
