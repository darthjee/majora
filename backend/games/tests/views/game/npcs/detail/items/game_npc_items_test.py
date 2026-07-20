"""Tests for the NPC items view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterItem, GameItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcItemsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/items.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the items list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/items.json'

    def test_returns_empty_list_when_no_items(self, client):
        """Test that an empty list is returned when the character has no items."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_item_id_name_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_item.id
        assert data[0]['game_item_id'] == game_item.id
        assert data[0]['name'] == 'Prized Gem'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the index endpoint."""
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        CharacterItem.objects.create(character=self.character, game_item=game_item)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_excludes_hidden_items(self, client):
        """Test that a hidden character item is excluded from the response."""
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        CharacterItem.objects.create(
            character=self.character, game_item=game_item, hidden=True,
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
            'game-npc-items',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGameNpcItemsHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_items."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        CharacterItem.objects.create(character=self.hidden_npc, game_item=game_item)

    def _url(self, character=None):
        """Return the items list URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/items.json'

    def test_hidden_npc_items_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's items gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_items_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's items."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_items_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's items."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_items_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's items."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_items_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's items includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_items_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's items includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameNpcItemsCreate(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/items.json."""

    def setup_method(self):
        """Set up a game, a DM, an NPC, a PC's owning player, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player = PlayerFactory(name='Frodo')
        self.pc_owner = UserFactory(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        CharacterFactory(name='Frodo', game=self.game, player=self.player, npc=False)
        self.other_user = UserFactory(username='other', password='secret-password')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the items list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/items.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create an item, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_dm_can_create_item(self, client):
        """Test that the game's DM can create an item for an NPC."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            client, {'name': 'Staff', 'description': 'A wizard staff.', 'hidden': True},
            token=token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'Staff'
        assert data['description'] == 'A wizard staff.'
        assert data['hidden'] is True

    def test_create_persists_game_item_and_character_item(self, client):
        """Test that the create endpoint persists both a GameItem and a CharacterItem."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(client, {'name': 'Staff'}, token=token)
        data = json.loads(response.content)
        character_item = CharacterItem.objects.get(id=data['id'])
        assert character_item.character == self.character
        game_item = GameItem.objects.get(id=data['game_item_id'])
        assert game_item.game == self.game
        assert game_item.name == 'Staff'

    def test_superuser_can_create_item(self, client):
        """Test that a superuser can create an item for an NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'name': 'Staff'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_item(self, client):
        """Test that a global Staff account can create an item for an NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'name': 'Staff'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'name': 'Staff'})
        assert response.status_code == 401

    def test_pc_owner_returns_403(self, client):
        """Test that a PC's owning player (not a DM) is rejected with 403 for an NPC."""
        token = Token.objects.create(user=self.pc_owner)
        response = self._post(client, {'name': 'Staff'}, token=token)
        assert response.status_code == 403

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(client, {'name': 'Staff'}, token=token)
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
            data=json.dumps({'name': 'Staff'}),
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
            data=json.dumps({'name': 'Staff'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404
