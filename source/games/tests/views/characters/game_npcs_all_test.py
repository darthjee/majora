"""Tests for the game_npcs_all view (DM/superuser only, includes hidden NPCs)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)

NPCS_ALL_URL = '/games/test-game/npcs/all.json'


@pytest.mark.django_db
class TestGameNpcsAllView(TokenAuthRequestMixin):
    """Tests for the game_npcs_all endpoint (DM/superuser only, includes hidden NPCs)."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.visible_npc = CharacterFactory(
            name='Visible NPC', game=self.game, npc=True, hidden=False
        )
        self.hidden_npc = CharacterFactory(
            name='Hidden NPC', game=self.game, npc=True, hidden=True
        )

    def _get(self, client, token=None):
        """Issue a GET request to the npcs/all endpoint, optionally with a token."""
        return self.get(client, NPCS_ALL_URL, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that unauthenticated request returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(client, token=token)
        assert response.status_code == 403

    def test_returns_200_for_dm_with_all_npcs(self, client):
        """Test that a DM gets 200 with both visible and hidden NPCs."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible NPC' in names
        assert 'Hidden NPC' in names

    def test_returns_200_for_superuser_with_all_npcs(self, client):
        """Test that a superuser gets 200 with both visible and hidden NPCs."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, '/games/unknown-game/npcs/all.json', token=token)
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self, client):
        """Test that the response includes page/pages/per_page/total headers."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '2'

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_does_not_include_pcs(self, client):
        """Test that the endpoint only returns NPCs, not PCs."""
        player = PlayerFactory(name='Alice')
        CharacterFactory(name='Alice PC', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Alice PC' not in names

    def _get_with_query(self, client, query, token=None):
        """Issue a GET request to the npcs/all endpoint with a query string."""
        return self.get(client, f'{NPCS_ALL_URL}{query}', token=token)

    def _names(self, response):
        """Return the list of character names from a JSON response."""
        return [item['name'] for item in json.loads(response.content)]

    def test_slain_true_returns_only_slain_npcs(self, client):
        """Test that slain=true returns only slain NPCs."""
        self.visible_npc.slain = True
        self.visible_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?slain=true', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_slain_false_returns_only_alive_npcs(self, client):
        """Test that slain=false returns only alive NPCs."""
        self.visible_npc.slain = True
        self.visible_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?slain=false', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_invalid_slain_value_is_ignored(self, client):
        """Test that an unrecognized slain value applies no filter and does not 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?slain=unknown', token=token)
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_name_filter_matches_case_insensitively(self, client):
        """Test that name filters case-insensitively, anywhere in the name."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?name=hidden', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_name_and_slain_filters_combine(self, client):
        """Test that name and slain filters apply together (AND)."""
        self.hidden_npc.slain = True
        self.hidden_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?name=NPC&slain=true', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_filters_combine_with_pagination(self, client):
        """Test that filtered results affect the pages header."""
        self.hidden_npc.slain = True
        self.hidden_npc.save()
        CharacterFactory(name='Another Slain NPC', game=self.game, npc=True, slain=True)
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?slain=true&per_page=1', token=token)
        assert response['pages'] == '2'
        assert response['total'] == '2'

    def test_no_filter_params_preserves_current_behavior(self, client):
        """Test that omitting filter params returns the unfiltered NPC list."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '', token=token)
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_allegiance_filter_matches_real_allegiance(self, client):
        """Test that ?allegiance= filters npcs/all.json on the real allegiance field."""
        self.visible_npc.allegiance = 'ally'
        self.visible_npc.public_allegiance = 'enemy'
        self.visible_npc.save()
        self.hidden_npc.allegiance = 'enemy'
        self.hidden_npc.public_allegiance = 'ally'
        self.hidden_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?allegiance=ally', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_invalid_allegiance_value_is_ignored(self, client):
        """Test that an unrecognized allegiance value applies no filter and does not 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(client, '?allegiance=unknown', token=token)
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_permission_enforced_regardless_of_filter_params(self, client):
        """Test that GameEditPermission is still enforced when filter params are present."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get_with_query(client, '?slain=true&name=NPC', token=token)
        assert response.status_code == 403
