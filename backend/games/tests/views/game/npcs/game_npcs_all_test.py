"""Tests for the game_npcs_all view (DM/superuser only, includes hidden NPCs)."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)

NPCS_ALL_URL = '/games/test-game/npcs/all.json'


class TestGameNpcsAllView(TokenAuthRequestMixin, TestCase):
    """Tests for the game_npcs_all endpoint (DM/superuser only, includes hidden NPCs)."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.visible_npc = CharacterFactory(
            name='Visible NPC', game=cls.game, npc=True, hidden=False
        )
        cls.hidden_npc = CharacterFactory(
            name='Hidden NPC', game=cls.game, npc=True, hidden=True
        )

    def _get(self, client, token=None):
        """Issue a GET request to the npcs/all endpoint, optionally with a token."""
        return self.get(client, NPCS_ALL_URL, token=token)

    def test_returns_401_for_unauthenticated(self):
        """Test that unauthenticated request returns 401."""
        response = self._get(self.client)
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self):
        """Test that an authenticated user who is not a DM gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 403

    def test_returns_200_for_dm_with_all_npcs(self):
        """Test that a DM gets 200 with both visible and hidden NPCs."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible NPC' in names
        assert 'Hidden NPC' in names

    def test_returns_200_with_hidden_field_in_response_body(self):
        """Test that the response body includes the correct `hidden` value for each NPC."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        by_name = {item['name']: item['hidden'] for item in data}
        assert by_name['Visible NPC'] is False
        assert by_name['Hidden NPC'] is True

    def test_returns_200_for_superuser_with_all_npcs(self):
        """Test that a superuser gets 200 with both visible and hidden NPCs."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(self.client, '/games/unknown-game/npcs/all.json', token=token)
        assert response.status_code == 404

    def test_includes_treasure_value_summed_across_treasures(self):
        """Test that treasure_value sums total_value across an NPC's treasure rows."""
        treasure_one = TreasureFactory(name='Potion', value=50)
        treasure_two = TreasureFactory(name='Sword', value=100)
        CharacterTreasure.objects.create(
            character=self.visible_npc, treasure=treasure_one, quantity=2, total_value=100,
        )
        CharacterTreasure.objects.create(
            character=self.visible_npc, treasure=treasure_two, quantity=1, total_value=100,
        )
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        by_name = {item['name']: item['treasure_value'] for item in data}
        assert by_name['Visible NPC'] == 200
        assert by_name['Hidden NPC'] == 0

    def test_response_includes_pagination_headers(self):
        """Test that the response includes page/pages/per_page/total headers."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '2'

    def test_response_includes_x_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_does_not_include_pcs(self):
        """Test that the endpoint only returns NPCs, not PCs."""
        player = PlayerFactory(name='Alice')
        CharacterFactory(name='Alice PC', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
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

    def test_slain_true_returns_only_slain_npcs(self):
        """Test that slain=true returns only slain NPCs."""
        self.visible_npc.slain = True
        self.visible_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?slain=true', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_slain_false_returns_only_alive_npcs(self):
        """Test that slain=false returns only alive NPCs."""
        self.visible_npc.slain = True
        self.visible_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?slain=false', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_invalid_slain_value_is_ignored(self):
        """Test that an unrecognized slain value applies no filter and does not 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?slain=unknown', token=token)
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_name_filter_matches_case_insensitively(self):
        """Test that name filters case-insensitively, anywhere in the name."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?name=hidden', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_name_and_slain_filters_combine(self):
        """Test that name and slain filters apply together (AND)."""
        self.hidden_npc.slain = True
        self.hidden_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?name=NPC&slain=true', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_filters_combine_with_pagination(self):
        """Test that filtered results affect the pages header."""
        self.hidden_npc.slain = True
        self.hidden_npc.save()
        CharacterFactory(name='Another Slain NPC', game=self.game, npc=True, slain=True)
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?slain=true&per_page=1', token=token)
        assert response['pages'] == '2'
        assert response['total'] == '2'

    def test_no_filter_params_preserves_current_behavior(self):
        """Test that omitting filter params returns the unfiltered NPC list."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '', token=token)
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_allegiance_filter_matches_real_allegiance(self):
        """Test that ?allegiance= filters npcs/all.json on the real allegiance field."""
        self.visible_npc.allegiance = 'ally'
        self.visible_npc.public_allegiance = 'enemy'
        self.visible_npc.save()
        self.hidden_npc.allegiance = 'enemy'
        self.hidden_npc.public_allegiance = 'ally'
        self.hidden_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?allegiance=ally', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_slain_filter_matches_real_slain(self):
        """Test that ?slain= filters npcs/all.json on the real slain field, not public_slain."""
        self.visible_npc.slain = True
        self.visible_npc.public_slain = False
        self.visible_npc.save()
        self.hidden_npc.slain = False
        self.hidden_npc.public_slain = True
        self.hidden_npc.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?slain=true', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_invalid_allegiance_value_is_ignored(self):
        """Test that an unrecognized allegiance value applies no filter and does not 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?allegiance=unknown', token=token)
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_hidden_true_returns_only_hidden_npcs(self):
        """Test that hidden=true returns only hidden NPCs."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?hidden=true', token=token)
        assert self._names(response) == ['Hidden NPC']

    def test_hidden_false_returns_only_visible_npcs(self):
        """Test that hidden=false returns only visible NPCs."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?hidden=false', token=token)
        assert self._names(response) == ['Visible NPC']

    def test_invalid_hidden_value_is_ignored(self):
        """Test that an unrecognized hidden value applies no filter and does not 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get_with_query(self.client, '?hidden=unknown', token=token)
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Hidden NPC', 'Visible NPC']

    def test_permission_enforced_regardless_of_filter_params(self):
        """Test that GameEditPermission is still enforced when filter params are present."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get_with_query(self.client, '?slain=true&name=NPC', token=token)
        assert response.status_code == 403
