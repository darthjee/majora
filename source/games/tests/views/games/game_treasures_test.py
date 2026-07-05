"""Tests for the game treasures view."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, Treasure


@pytest.mark.django_db
class TestGameTreasuresView:
    """Tests for the GET /games/<slug>/treasures.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.other_game = Game.objects.create(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_treasures(self, client):
        """Test that an empty list is returned when the game has no treasures."""
        response = client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_treasures(self, client):
        """Test that only treasures linked to the game are returned."""
        treasure = Treasure.objects.create(name='Gold Ring', value=100)
        other_treasure = Treasure.objects.create(name='Silver Dagger', value=50)
        self.game.treasures.add(treasure)
        self.other_game.treasures.add(other_treasure)
        response = client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_returns_id_name_value_fields(self, client):
        """Test that list items include id, name, and value fields."""
        treasure = Treasure.objects.create(name='Enchanted Bow', value=750)
        self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['id'] == treasure.id
        assert data[0]['name'] == 'Enchanted Bow'
        assert data[0]['value'] == 750

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get('/games/unknown-game/treasures.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/treasures.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/treasures.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            treasure = Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            treasure = Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-treasures', kwargs={'game_slug': 'test-game'})
        response = client.get(url)
        assert response.status_code == 200

    def test_does_not_return_unlinked_treasures(self, client):
        """Test that treasures not linked to the game are excluded."""
        Treasure.objects.create(name='Orphan Treasure', value=300)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []

    def test_returns_game_exclusive_treasures(self, client):
        """Test that treasures owned exclusively by the game (FK) are returned."""
        treasure = Treasure.objects.create(name='Exclusive Gem', value=400, game=self.game)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == treasure.id
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_union_of_linked_and_exclusive_treasures(self, client):
        """Test that both M2M-linked and FK-owned treasures are returned, without duplicates."""
        linked = Treasure.objects.create(name='Linked Gem', value=100)
        self.game.treasures.add(linked)
        exclusive = Treasure.objects.create(name='Exclusive Gem', value=200, game=self.game)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        names = {item['name'] for item in data}
        assert names == {'Linked Gem', 'Exclusive Gem'}
        assert len(data) == 2
        assert exclusive.id in {item['id'] for item in data}

    def test_does_not_return_other_games_exclusive_treasures(self, client):
        """Test that a treasure exclusive to another game is excluded."""
        Treasure.objects.create(name='Other Gem', value=300, game=self.other_game)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []


@pytest.mark.django_db
class TestGameTreasuresCreate:
    """Tests for the POST /games/<slug>/treasures.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a superuser, and a regular user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = User.objects.create_superuser(
            username='admin', password='secret-password'
        )
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(
            username='player', password='secret-password'
        )
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game treasures list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/treasures.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_treasure(self, client):
        """Test that a DM of the game can create a treasure and receives 201."""
        response = self._post(client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_treasure(self, client):
        """Test that a superuser can create a treasure and receives 201."""
        response = self._post(client, {'name': 'Gem', 'value': 100}, token=self.superuser_token)
        assert response.status_code == 201

    def test_created_treasure_is_linked_to_game_via_fk(self, client):
        """Test that the created treasure's game FK is set to the resolved game."""
        self._post(client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        treasure = Treasure.objects.get(name='Gem')
        assert treasure.game == self.game

    def test_create_returns_treasure_detail(self, client):
        """Test that the response body contains id, name, value, and game_slug."""
        response = self._post(client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        data = json.loads(response.content)
        assert data['name'] == 'Gem'
        assert data['value'] == 100
        assert data['game_slug'] == 'test-game'
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self, client):
        """Test that a POST without a token returns 401."""
        response = self._post(client, {'name': 'Gem', 'value': 100})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self, client):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(client, {'name': 'Gem', 'value': 100}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self, client):
        """Test that a POST without name returns 400."""
        response = self._post(client, {'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_value_returns_400(self, client):
        """Test that a POST without value returns 400."""
        response = self._post(client, {'name': 'Gem'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'value' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self, client):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            client, {'name': 'Gem', 'value': 100}, token=self.dm_token, game_slug='unknown-game'
        )
        assert response.status_code == 404

    def test_game_field_in_body_is_ignored(self, client):
        """Test that a game value in the request body does not override the resolved game."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        response = self._post(
            client, {'name': 'Gem', 'value': 100, 'game': other_game.id}, token=self.dm_token
        )
        assert response.status_code == 201
        treasure = Treasure.objects.get(name='Gem')
        assert treasure.game == self.game
