"""Tests for the NPC possessions view (list / create)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterPossession, GamePossession
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GamePossessionFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcPossessionsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/possessions.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the possessions list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/possessions.json'

    def test_returns_empty_list_when_no_possessions(self, client):
        """Test that an empty list is returned when the character has no possessions."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_possession_id_name_description_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        game_possession = GamePossessionFactory(
            game=self.game, name='The Tower', description='A tall stone tower.',
        )
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_possession.id
        assert data[0]['game_possession_id'] == game_possession.id
        assert data[0]['name'] == 'The Tower'
        assert data[0]['description'] == 'A tall stone tower.'
        assert data[0]['photo_path'] is None

    def test_excludes_hidden_possessions(self, client):
        """Test that a hidden character possession is excluded from the response."""
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-possessions',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGameNpcPossessionsHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_possessions."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        CharacterPossession.objects.create(
            character=self.hidden_npc, game_possession=game_possession,
        )

    def _url(self, character=None):
        """Return the possessions list URL for the given character (defaults to hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/possessions.json'

    def test_hidden_npc_possessions_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's possessions gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_possessions_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's possessions."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_possessions_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's possessions."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_possessions_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's possessions."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_possessions_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's possessions includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_possessions_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's possessions includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameNpcPossessionsCreate(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/possessions.json."""

    def setup_method(self):
        """Set up a game, a DM, an NPC, a PC's owning player, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player = PlayerFactory(name='Frodo', game=self.game)
        self.pc_owner = UserFactory(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        self.other_user = UserFactory(username='other', password='secret-password')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the possessions list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/possessions.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a possession, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_dm_can_create_possession(self, client):
        """Test that the game's DM can create a possession for an NPC."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            client, {'name': 'The Tower', 'description': 'A tall stone tower.', 'hidden': True},
            token=token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'The Tower'
        assert data['description'] == 'A tall stone tower.'
        assert data['hidden'] is True

    def test_create_persists_game_possession_and_character_possession(self, client):
        """Test that the create endpoint persists both a GamePossession and CharacterPossession."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            client, {'name': 'The Tower', 'description': 'A tall stone tower.'}, token=token,
        )
        data = json.loads(response.content)
        character_possession = CharacterPossession.objects.get(id=data['id'])
        assert character_possession.character == self.character
        game_possession = GamePossession.objects.get(id=data['game_possession_id'])
        assert game_possession.game == self.game
        assert game_possession.name == 'The Tower'
        assert game_possession.description == 'A tall stone tower.'

    def test_superuser_can_create_possession(self, client):
        """Test that a superuser can create a possession for an NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_possession(self, client):
        """Test that a global Staff account can create a possession for an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'name': 'The Tower'})
        assert response.status_code == 401

    def test_pc_owner_can_create_possession(self, client):
        """Test that a PC's owning player (any player of the game) can create an NPC possession."""
        token = Token.objects.create(user=self.pc_owner)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 201

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 403

    def test_missing_name_returns_400(self, client):
        """Test that a missing name returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(client, {}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        token = Token.objects.create(user=self.dm_user)
        response = client.post(
            self._url(character_id=99999),
            data=json.dumps({'name': 'The Tower'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = client.post(
            self._url(character_id=other.id),
            data=json.dumps({'name': 'The Tower'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestGameNpcPossessionsCreateHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate on POST possessions for an NPC."""

    def setup_method(self):
        """Set up a game, a DM, a hidden NPC, and a player unrelated to the NPC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.player = PlayerFactory(name='Frodo', game=self.game)
        self.pc_owner = UserFactory(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)

    def _url(self):
        """Return the possessions list URL for the hidden NPC."""
        return f'/games/test-game/npcs/{self.hidden_npc.id}/possessions.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a possession, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_player_gets_404_for_hidden_npc(self, client):
        """Test that any player of the game gets 404, despite the broadened create permission."""
        token = Token.objects.create(user=self.pc_owner)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 404
        assert not CharacterPossession.objects.filter(character=self.hidden_npc).exists()

    def test_regular_user_gets_404_for_hidden_npc(self, client):
        """Test that a regular authenticated user (not even a player) gets 404."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 404

    def test_dm_can_still_create_possession_for_hidden_npc(self, client):
        """Test that a DM can still create a possession for a hidden NPC."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 201
        assert CharacterPossession.objects.filter(character=self.hidden_npc).exists()

    def test_superuser_can_still_create_possession_for_hidden_npc(self, client):
        """Test that a superuser can still create a possession for a hidden NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 201

    def test_staff_gets_404_for_hidden_npc(self, client):
        """Test that a global Staff account gets 404, despite otherwise being able to create."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'name': 'The Tower'}, token=token)
        assert response.status_code == 404
