"""Tests for the game NPC list view, and NPC creation."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcsView:
    """Tests for the game NPCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Alice')

    def _url(self, query=''):
        """Return the list URL for the fixture game, optionally with a query string."""
        return f'/games/test-game/npcs.json{query}'

    def test_returns_only_matching_role(self, client):
        """Test that only NPCs are returned."""
        CharacterFactory(name='Hero', game=self.game, player=self.player, npc=False)
        CharacterFactory(name='Villain', game=self.game, npc=True)
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Villain'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_none(self, client):
        """Test that an empty list is returned when there are no matching characters."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(self._url())
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(self._url('?per_page=5'))
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            CharacterFactory(name=f'Character {i}', game=self.game, npc=True)
        response = client.get(self._url('?page=2&per_page=3'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            CharacterFactory(name=f'Character {i}', game=self.game, npc=True)
        response = client.get(self._url('?per_page=2'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_total_header(self, client):
        """Test that the response includes the total item count header."""
        for i in range(3):
            CharacterFactory(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get(self._url())
        assert response['total'] == '3'

    def test_default_page_size_uses_settings(self, client, monkeypatch):
        """Test that default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '3')
        for i in range(5):
            CharacterFactory(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get(self._url())
        assert response['per_page'] == '3'
        data = json.loads(response.content)
        assert len(data) == 3

    def test_includes_treasure_value_summed_across_treasures(self, client):
        """Test that treasure_value sums total_value across the NPC's treasure rows."""
        npc = CharacterFactory(name='Villain', game=self.game, npc=True)
        treasure_one = TreasureFactory(name='Potion', value=50)
        treasure_two = TreasureFactory(name='Sword', value=100)
        CharacterTreasure.objects.create(
            character=npc, treasure=treasure_one, quantity=2, total_value=100,
        )
        CharacterTreasure.objects.create(
            character=npc, treasure=treasure_two, quantity=1, total_value=100,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['treasure_value'] == 200


@pytest.mark.django_db
class TestGameNpcsHiddenFilter:
    """Tests that game_npcs excludes hidden NPCs from the public listing."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_hidden_npc_excluded_from_listing(self, client):
        """Test that an NPC with hidden=True is not returned by the public listing."""
        CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        CharacterFactory(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible NPC'

    def test_visible_npc_included_in_listing(self, client):
        """Test that an NPC with hidden=False is returned by the public listing."""
        CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_total_header_excludes_hidden_npcs(self, client):
        """Test that the total header reflects only visible NPCs."""
        CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        CharacterFactory(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '1'


@pytest.mark.django_db
class TestGameNpcsFilter:
    """Tests that game_npcs supports filtering by slain/name query params."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def _names(self, response):
        """Return the list of character names from a JSON response."""
        return [item['name'] for item in json.loads(response.content)]

    def test_slain_true_returns_only_slain_npcs(self, client):
        """Test that slain=true returns only publicly slain NPCs."""
        CharacterFactory(name='Alive NPC', game=self.game, npc=True, public_slain=False)
        CharacterFactory(name='Dead NPC', game=self.game, npc=True, public_slain=True)
        response = client.get('/games/test-game/npcs.json?slain=true')
        assert self._names(response) == ['Dead NPC']

    def test_slain_false_returns_only_alive_npcs(self, client):
        """Test that slain=false returns only publicly alive NPCs."""
        CharacterFactory(name='Alive NPC', game=self.game, npc=True, public_slain=False)
        CharacterFactory(name='Dead NPC', game=self.game, npc=True, public_slain=True)
        response = client.get('/games/test-game/npcs.json?slain=false')
        assert self._names(response) == ['Alive NPC']

    def test_invalid_slain_value_is_ignored(self, client):
        """Test that an unrecognized slain value applies no filter and does not 400."""
        CharacterFactory(name='Alive NPC', game=self.game, npc=True, public_slain=False)
        CharacterFactory(name='Dead NPC', game=self.game, npc=True, public_slain=True)
        response = client.get('/games/test-game/npcs.json?slain=unknown')
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Alive NPC', 'Dead NPC']

    def test_name_filter_matches_case_insensitively(self, client):
        """Test that name filters case-insensitively, anywhere in the name."""
        CharacterFactory(name='Sir Villain', game=self.game, npc=True)
        CharacterFactory(name='Hero', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?name=villain')
        assert self._names(response) == ['Sir Villain']

    def test_name_and_slain_filters_combine(self, client):
        """Test that name and slain filters apply together (AND)."""
        CharacterFactory(name='Sir Villain', game=self.game, npc=True, public_slain=True)
        CharacterFactory(name='Sir Villain Twin', game=self.game, npc=True, public_slain=False)
        response = client.get('/games/test-game/npcs.json?name=villain&slain=true')
        assert self._names(response) == ['Sir Villain']

    def test_filters_combine_with_pagination(self, client):
        """Test that filtered results affect the pages header."""
        for i in range(3):
            CharacterFactory(name=f'Slain NPC {i}', game=self.game, npc=True, public_slain=True)
        CharacterFactory(name='Alive NPC', game=self.game, npc=True, public_slain=False)
        response = client.get('/games/test-game/npcs.json?slain=true&per_page=2')
        assert response['pages'] == '2'
        assert response['total'] == '3'

    def test_no_filter_params_preserves_current_behavior(self, client):
        """Test that omitting filter params returns the unfiltered NPC list."""
        CharacterFactory(name='Alive NPC', game=self.game, npc=True, public_slain=False)
        CharacterFactory(name='Dead NPC', game=self.game, npc=True, public_slain=True)
        response = client.get('/games/test-game/npcs.json')
        assert sorted(self._names(response)) == ['Alive NPC', 'Dead NPC']

    def test_slain_filter_matches_public_slain(self, client):
        """Test that ?slain= filters npcs.json on public_slain, not the real slain field."""
        CharacterFactory(
            name='Faked Death NPC', game=self.game, npc=True, slain=False, public_slain=True,
        )
        CharacterFactory(
            name='Hidden Death NPC', game=self.game, npc=True, slain=True, public_slain=False,
        )
        response = client.get('/games/test-game/npcs.json?slain=true')
        assert self._names(response) == ['Faked Death NPC']

    def test_allegiance_filter_matches_public_allegiance(self, client):
        """Test that ?allegiance= filters npcs.json on public_allegiance."""
        CharacterFactory(
            name='Friendly NPC', game=self.game, npc=True,
            allegiance='enemy', public_allegiance='ally',
        )
        CharacterFactory(
            name='Hostile NPC', game=self.game, npc=True,
            allegiance='ally', public_allegiance='enemy',
        )
        response = client.get('/games/test-game/npcs.json?allegiance=ally')
        assert self._names(response) == ['Friendly NPC']

    def test_invalid_allegiance_value_is_ignored(self, client):
        """Test that an unrecognized allegiance value applies no filter and does not 400."""
        CharacterFactory(name='Ally NPC', game=self.game, npc=True, public_allegiance='ally')
        CharacterFactory(name='Enemy NPC', game=self.game, npc=True, public_allegiance='enemy')
        response = client.get('/games/test-game/npcs.json?allegiance=unknown')
        assert response.status_code == 200
        assert sorted(self._names(response)) == ['Ally NPC', 'Enemy NPC']


@pytest.mark.django_db
class TestGameNpcsCreate(TokenAuthRequestMixin):
    """Tests for the POST /games/<slug>/npcs.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a superuser, and a regular user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Alice')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game NPCs list endpoint, optionally with a token."""
        url = f'/games/{game_slug or self.game.game_slug}/npcs.json'
        return self.post(client, url, payload, token=token)

    def test_game_master_can_create_npc(self, client):
        """Test that a DM of the game can create an NPC and receives 201."""
        response = self._post(client, {'name': 'Villain'}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_npc(self, client):
        """Test that a superuser can create an NPC and receives 201."""
        response = self._post(client, {'name': 'Villain'}, token=self.superuser_token)
        assert response.status_code == 201

    def test_created_character_is_npc_linked_to_game(self, client):
        """Test that the created character has npc=True and is linked to the game."""
        self._post(client, {'name': 'Villain'}, token=self.dm_token)
        character = Character.objects.get(name='Villain')
        assert character.npc is True
        assert character.game == self.game

    def test_create_returns_character_detail(self, client):
        """Test that the response body matches the CharacterDetailSerializer shape."""
        response = self._post(
            client, {'name': 'Villain', 'role': 'Antagonist'}, token=self.dm_token
        )
        data = json.loads(response.content)
        assert data['name'] == 'Villain'
        assert data['role'] == 'Antagonist'
        assert data['game_slug'] == 'test-game'
        assert data['can_edit'] is True
        assert 'id' in data

    def test_optional_fields_are_persisted_when_provided(self, client):
        """Test that optional fields are persisted when provided in the request."""
        self._post(
            client,
            {
                'name': 'Villain',
                'role': 'Antagonist',
                'public_description': 'A shady figure',
                'private_description': 'Secretly a good person',
                'hidden': True,
                'money': 42,
                'allegiance': 'ally',
                'public_allegiance': 'enemy',
            },
            token=self.dm_token,
        )
        character = Character.objects.get(name='Villain')
        assert character.role == 'Antagonist'
        assert character.public_description == 'A shady figure'
        assert character.private_description == 'Secretly a good person'
        assert character.hidden is True
        assert character.money == 42
        assert character.allegiance == 'ally'
        assert character.public_allegiance == 'enemy'

    def test_defaults_apply_when_optional_fields_omitted(self, client):
        """Test that optional fields fall back to model defaults when omitted."""
        self._post(client, {'name': 'Villain'}, token=self.dm_token)
        character = Character.objects.get(name='Villain')
        assert character.hidden is False
        assert character.allegiance == 'neutral'
        assert character.public_allegiance == 'neutral'

    def test_unauthenticated_post_returns_401(self, client):
        """Test that a POST without a token returns 401."""
        response = self._post(client, {'name': 'Villain'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self, client):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(client, {'name': 'Villain'}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self, client):
        """Test that a POST without name returns 400."""
        response = self._post(client, {'role': 'Antagonist'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self, client):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            client, {'name': 'Villain'}, token=self.dm_token, game_slug='unknown-game'
        )
        assert response.status_code == 404

    def test_player_field_in_body_is_ignored(self, client):
        """Test that a player value in the request body does not assign a player."""
        response = self._post(
            client, {'name': 'Villain', 'player': self.player.id}, token=self.dm_token
        )
        assert response.status_code == 201
        character = Character.objects.get(name='Villain')
        assert character.player is None

    def test_links_in_payload_create_character_links(self, client):
        """Test that an initial links array creates CharacterLinks for the new NPC."""
        response = self._post(
            client,
            {
                'name': 'Villain',
                'links': [
                    {'text': 'Loot table', 'url': 'http://example.com/loot'},
                    {'url': 'http://example.com/wiki'},
                ],
            },
            token=self.dm_token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        character = Character.objects.get(name='Villain')
        assert character.links.count() == 2
        assert {link['url'] for link in data['links']} == {
            'http://example.com/loot', 'http://example.com/wiki',
        }

    def test_links_entry_without_url_returns_400(self, client):
        """Test that an initial link entry missing a url causes the whole request to fail."""
        response = self._post(
            client,
            {'name': 'Villain', 'links': [{'text': 'Missing url'}]},
            token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'links' in data['errors']
        assert not Character.objects.filter(name='Villain').exists()
