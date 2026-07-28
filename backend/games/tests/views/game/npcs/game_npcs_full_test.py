"""Tests for the POST /games/<slug>/npcs/full.json endpoint (DM/admin/superuser-only NPC create).

Mirrors game_npcs_test.py's pre-#868 create tests verbatim — this is exactly today's pre-#868
`npcs.json` create behavior, now relocated to `npcs/full.json`.
"""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import Character
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


@pytest.mark.django_db
class TestGameNpcsFullCreate(TokenAuthRequestMixin):
    """Tests for the POST /games/<slug>/npcs/full.json endpoint."""

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
        """Issue a POST request to the game NPCs full-create endpoint, optionally with a token."""
        url = f'/games/{game_slug or self.game.game_slug}/npcs/full.json'
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
        assert 'can_edit' not in data
        assert 'id' in data

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(client, {'name': 'Villain'}, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

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
                'private_allegiance': 'ally',
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
        assert character.private_allegiance == 'ally'
        assert character.public_allegiance == 'enemy'

    def test_defaults_apply_when_optional_fields_omitted(self, client):
        """Test that optional fields fall back to model defaults when omitted."""
        self._post(client, {'name': 'Villain'}, token=self.dm_token)
        character = Character.objects.get(name='Villain')
        assert character.hidden is False
        assert character.private_allegiance == 'neutral'
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
