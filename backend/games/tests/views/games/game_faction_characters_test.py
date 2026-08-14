"""Tests for the game faction characters view (public, non-hidden characters)."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


@pytest.mark.django_db
class TestGameFactionCharactersView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/factions/<faction_id>/characters.json."""

    def setup_method(self):
        """Set up a game, a faction, and a mix of PC/NPC/hidden members."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, faction_id=None, game_slug='test-game'):
        """Return the faction characters URL (defaults to the fixture faction)."""
        faction_id = faction_id if faction_id is not None else self.game_faction.id
        return f'/games/{game_slug}/factions/{faction_id}/characters.json'

    def test_returns_empty_list_when_no_characters(self, client):
        """Test that an empty list is returned when the faction has no members."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_name_photo_path_type_fields_for_a_pc(self, client):
        """Test that a PC member serializes with the expected fields and type 'pc'."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        CharacterFaction.objects.create(character=pc, game_faction=self.game_faction)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == pc.id
        assert data[0]['name'] == 'Aragorn'
        assert data[0]['photo_path'] is None
        assert data[0]['type'] == 'pc'

    def test_returns_type_npc_for_an_npc_member(self, client):
        """Test that an NPC member serializes with type 'npc'."""
        npc = CharacterFactory(name='Sauron', game=self.game, npc=True)
        CharacterFaction.objects.create(character=npc, game_faction=self.game_faction)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['type'] == 'npc'

    def test_excludes_hidden_characters(self, client):
        """Test that a hidden character member is excluded from the response."""
        hidden = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        CharacterFaction.objects.create(character=hidden, game_faction=self.game_faction)
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_includes_slain_characters_by_default(self, client):
        """Test that slain characters are included by default (no slain-filtering)."""
        slain = CharacterFactory(
            name='Fallen Hero', game=self.game, npc=False, public_slain=True,
        )
        CharacterFaction.objects.create(character=slain, game_faction=self.game_faction)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1

    def test_does_not_set_x_skip_cache_header(self, client):
        """Test that no X-Skip-Cache header is set on the regular listing."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a faction not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_faction = GameFactionFactory(game=other_game, name='Foreign Faction')
        response = client.get(self._url(faction_id=other_faction.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get(self._url(game_slug='no-such-game'))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-faction-characters',
            kwargs={'game_slug': 'test-game', 'faction_id': self.game_faction.id},
        )
        response = client.get(url)
        assert response.status_code == 200
