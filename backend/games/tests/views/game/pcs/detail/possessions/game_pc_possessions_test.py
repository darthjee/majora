"""Tests for the PC possessions view (list / create)."""

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
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcPossessionsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/possessions.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the possessions list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/possessions.json'

    def test_returns_empty_list_when_no_possessions(self, client):
        """Test that an empty list is returned when the character has no possessions."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_possession_id_name_description_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        game_possession = GamePossessionFactory(
            game=self.game, name='Bag End', description='A comfortable hobbit-hole.',
        )
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_possession.id
        assert data[0]['game_possession_id'] == game_possession.id
        assert data[0]['name'] == 'Bag End'
        assert data[0]['description'] == 'A comfortable hobbit-hole.'
        assert data[0]['photo_path'] is None

    def test_excludes_hidden_possessions(self, client):
        """Test that a hidden character possession is excluded from the response."""
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing list."""
        game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

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
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-possessions',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_returns_possessions_ordered_by_id(self, client):
        """Test that possessions are returned ordered by id."""
        first_game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        second_game_possession = GamePossessionFactory(game=self.game, name='The Prancing Pony')
        first = CharacterPossession.objects.create(
            character=self.character, game_possession=first_game_possession,
        )
        second = CharacterPossession.objects.create(
            character=self.character, game_possession=second_game_possession,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


@pytest.mark.django_db
class TestGamePcPossessionsCreate(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/possessions.json."""

    def setup_method(self):
        """Set up a game, a DM, an owning player/PC, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.other_user = UserFactory(username='other', password='secret-password')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the possessions list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/possessions.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a possession, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_owner_can_create_possession(self, client):
        """Test that the PC's owning player can create a possession."""
        token = Token.objects.create(user=self.owner)
        response = self._post(
            client, {'name': 'Bag End', 'description': 'A hobbit-hole.', 'hidden': True},
            token=token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'Bag End'
        assert data['description'] == 'A hobbit-hole.'
        assert data['hidden'] is True
        assert data['photo_path'] is None

    def test_create_persists_game_possession_and_character_possession(self, client):
        """Test that the create endpoint persists both a GamePossession and CharacterPossession."""
        token = Token.objects.create(user=self.owner)
        response = self._post(
            client, {'name': 'Bag End', 'description': 'A hobbit-hole.'}, token=token,
        )
        data = json.loads(response.content)
        character_possession = CharacterPossession.objects.get(id=data['id'])
        assert character_possession.character == self.character
        game_possession = GamePossession.objects.get(id=data['game_possession_id'])
        assert game_possession.game == self.game
        assert game_possession.name == 'Bag End'
        assert game_possession.description == 'A hobbit-hole.'

    def test_create_defaults_description_and_hidden(self, client):
        """Test that description defaults to '' and hidden defaults to False."""
        token = Token.objects.create(user=self.owner)
        response = self._post(client, {'name': 'Bag End'}, token=token)
        data = json.loads(response.content)
        assert data['description'] == ''
        assert data['hidden'] is False

    def test_dm_can_create_possession(self, client):
        """Test that the game's DM can create a possession for a PC."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(client, {'name': 'Bag End'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_possession(self, client):
        """Test that a global Staff account can create a possession for a PC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'name': 'Bag End'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'name': 'Bag End'})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(client, {'name': 'Bag End'}, token=token)
        assert response.status_code == 403

    def test_missing_name_returns_400(self, client):
        """Test that a missing name returns 400."""
        token = Token.objects.create(user=self.owner)
        response = self._post(client, {}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_blank_name_returns_400(self, client):
        """Test that a blank name returns 400."""
        token = Token.objects.create(user=self.owner)
        response = self._post(client, {'name': ''}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_name_too_long_returns_400(self, client):
        """Test that a name longer than 200 chars returns 400."""
        token = Token.objects.create(user=self.owner)
        response = self._post(client, {'name': 'x' * 201}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        token = Token.objects.create(user=self.owner)
        response = client.post(
            self._url(character_id=99999),
            data=json.dumps({'name': 'Bag End'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        token = Token.objects.create(user=self.owner)
        response = client.post(
            self._url(character_id=other.id),
            data=json.dumps({'name': 'Bag End'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404
