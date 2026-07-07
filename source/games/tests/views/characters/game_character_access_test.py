"""Tests for the PC/NPC access-check view."""

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


class _BaseCharacterAccessViewTest(TokenAuthRequestMixin):
    """Shared behavior for the PC and NPC access-check endpoints."""

    npc = None
    segment = None

    def _url(self, character=None, game_slug='test-game'):
        """Return the access-check URL for the given character (defaults to the fixture)."""
        character = character or self.character
        return f'/games/{game_slug}/{self.segment}/{character.id}/access.json'

    def _assert_is_owner(self, data, expected):
        """Assert the is_owner field, a no-op by default since NPCs expose no such field."""

    def test_anonymous_returns_200_with_can_edit_false(self, client):
        """Test that an anonymous request returns 200 with can_edit false."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_returns_can_edit_true(self, client):
        """Test that the DM of the game returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_superuser_returns_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_unrelated_user_returns_can_edit_false(self, client):
        """Test that an unrelated user returns 200 with can_edit false."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_200_with_can_edit_false_for_unknown_character(self, client):
        """Test that 200 with can_edit false is returned for a non-existent character_id."""
        response = client.get(f'/games/test-game/{self.segment}/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_character_in_wrong_game(self, client):
        """Test that 200 with can_edit false is returned when character belongs to another game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self.get(client, self._url())
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None
        self._assert_is_owner(data, None)

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True
        self._assert_is_owner(data, False)

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False
        self._assert_is_owner(data, False)

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test that non-DM authenticated user returns username, is_superuser=False, is_dm=False."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        self._assert_is_owner(data, False)

    def test_dm_via_session_returns_can_edit_true(self, client):
        """Test that the DM authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_via_session_returns_can_edit_false(self, client):
        """Test that a non-DM user authenticated via session cookie returns can_edit false."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False


@pytest.mark.django_db
class TestGameNpcAccessView(_BaseCharacterAccessViewTest):
    """Tests for the NPC access endpoint."""

    npc = True
    segment = 'npcs'

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

    def test_player_owner_not_dm_returns_can_edit_false(self, client):
        """Test that a PC player (not a DM) returns 200 with can_edit false."""
        token = Token.objects.create(user=self.pc_owner)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_pc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, player=self.player, npc=False)
        response = client.get(self._url(character=pc))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_pc_owner_returns_can_edit_true(self, client):
        """Test that a DM who also owns a PC in the game returns can_edit true for NPC."""
        dm_player = PlayerFactory(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        CharacterFactory(name='DM PC', game=self.game, player=dm_player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True


@pytest.mark.django_db
class TestGamePcAccessView(_BaseCharacterAccessViewTest):
    """Tests for the PC access endpoint."""

    npc = False
    segment = 'pcs'

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )

    def _assert_is_owner(self, data, expected):
        """Assert the is_owner field exposed by the PC access endpoint."""
        assert data['is_owner'] is expected

    def test_owner_returns_can_edit_true(self, client):
        """Test that the PC owner returns 200 with can_edit true."""
        token = Token.objects.create(user=self.owner)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_returns_200_with_can_edit_false_for_npc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        response = client.get(self._url(character=npc))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_owner_returns_can_edit_true(self, client):
        """Test that a user who is both DM and character owner returns can_edit true."""
        dm_player = PlayerFactory(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        self.character.player = dm_player
        self.character.save()
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_owner_returns_correct_user_context_fields(self, client):
        """Test that owner returns username, is_superuser=False, is_dm=False, is_owner=True."""
        token = Token.objects.create(user=self.owner)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'owner'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is True

    def test_owner_via_session_returns_can_edit_true(self, client):
        """Test that the PC owner authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.owner)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True
