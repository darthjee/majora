"""Tests for the NPC permissions-check view."""

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


@pytest.mark.django_db
class TestGameNpcPermissionsView(TokenAuthRequestMixin):
    """Tests for the NPC permissions endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Alice')
        self.pc_owner = UserFactory(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character=None, game_slug='test-game', query=''):
        """Return the permissions-check URL for the given character (defaults to the fixture)."""
        character = character or self.character
        url = f'/games/{game_slug}/npcs/{character.id}/permissions.json'
        if query:
            url = f'{url}?{query}'
        return url

    def test_returns_200_with_can_edit_false_for_unknown_character(self, client):
        """Test that 200 with can_edit False is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/permissions.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_includes_x_skip_cache_header_without_role(self, client):
        """Test that the response sets X-Skip-Cache: true when no role param is given."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'
        assert 'X-Force-Public-Cache' not in response

    def test_dm_can_edit(self, client):
        """Test that the game's DM gets can_edit True."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_superuser_can_edit(self, client):
        """Test that a superuser gets can_edit True."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_anonymous_cannot_edit(self, client):
        """Test that an unauthenticated request gets can_edit False."""
        response = self.get(client, self._url())
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_role_dm_can_edit_regardless_of_real_identity(self, client):
        """Test that ?role=dm grants can_edit True even for an anonymous caller."""
        response = self.get(client, self._url(query='role=dm'))
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_role_superuser_can_edit(self, client):
        """Test that ?role=superuser grants can_edit True."""
        response = self.get(client, self._url(query='role=superuser'))
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self, client):
        """Test that an unrecognized role still switches to the role-simulated path."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(query='role=bogus'), token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_omits_x_skip_cache_and_sets_force_public_cache_with_role(self, client):
        """Test that a role-simulated response sets X-Force-Public-Cache instead of X-Skip-Cache."""
        response = self.get(client, self._url(query='role=dm'))
        assert 'X-Skip-Cache' not in response
        assert response['X-Force-Public-Cache'] == 'true'

    def test_role_owner_is_a_no_op_for_npc(self, client):
        """Test that ?role=owner never grants can_edit for an NPC."""
        response = self.get(client, self._url(query='role=owner'))
        data = json.loads(response.content)
        assert data == {'can_edit': False}
