"""Tests for the game NPCs list view (visible NPCs only), and NPC creation."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcsView:
    """Tests for the game NPCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_npcs(self, client):
        """Test that only characters with npc=True are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Villain'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_npcs(self, client):
        """Test that an empty list is returned when there are no NPCs."""
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/npcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_response_includes_total_header(self, client):
        """Test that the response includes the total item count header."""
        for i in range(3):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '3'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_default_page_size_uses_settings(self, client, monkeypatch):
        """Test that default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '3')
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['per_page'] == '3'
        data = json.loads(response.content)
        assert len(data) == 3


@pytest.mark.django_db
class TestGameNpcsHiddenFilter:
    """Tests that game_npcs excludes hidden NPCs from the public listing."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_hidden_npc_excluded_from_listing(self, client):
        """Test that an NPC with hidden=True is not returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible NPC'

    def test_visible_npc_included_in_listing(self, client):
        """Test that an NPC with hidden=False is returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_total_header_excludes_hidden_npcs(self, client):
        """Test that the total header reflects only visible NPCs."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '1'


@pytest.mark.django_db
class TestGameNpcsCreate:
    """Tests for the POST /games/<slug>/npcs.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a superuser, and a regular user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game NPCs list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/npcs.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

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
            },
            token=self.dm_token,
        )
        character = Character.objects.get(name='Villain')
        assert character.role == 'Antagonist'
        assert character.public_description == 'A shady figure'
        assert character.private_description == 'Secretly a good person'
        assert character.hidden is True
        assert character.money == 42

    def test_defaults_apply_when_optional_fields_omitted(self, client):
        """Test that optional fields fall back to model defaults when omitted."""
        self._post(client, {'name': 'Villain'}, token=self.dm_token)
        character = Character.objects.get(name='Villain')
        assert character.hidden is False

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
