"""Tests for the game items view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterItem, GameItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameItemsView(TestCase):
    """Tests for the GET /games/<slug>/items.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_items(self):
        """Test that an empty list is returned when the game has no items."""
        response = self.client.get('/games/test-game/items.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_items(self):
        """Test that only items belonging to the game are returned."""
        GameItemFactory(game=self.game, name='Gold Ring')
        GameItemFactory(game=self.other_game, name='Silver Dagger')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_returns_id_name_photo_path_fields(self):
        """Test that list items include id, name, and photo_path fields."""
        item = GameItemFactory(game=self.game, name='Enchanted Bow', description='A fine bow.')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert data[0]['id'] == item.id
        assert data[0]['name'] == 'Enchanted Bow'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self):
        """Test that description is not exposed on the index endpoint."""
        GameItemFactory(game=self.game, name='Enchanted Bow', description='A fine bow.')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_excludes_hidden_items(self):
        """Test that a hidden game item is excluded from the response."""
        GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert data == []

    def test_includes_visible_items_alongside_hidden_ones(self):
        """Test that non-hidden items are still returned when hidden ones exist too."""
        visible = GameItemFactory(game=self.game, name='Visible Gem')
        GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == visible.id

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing list."""
        GameItemFactory(game=self.game, name='Gem')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/items.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/items.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/items.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/items.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameItemFactory(game=self.game, name=f'Item {i}')
        response = self.client.get('/games/test-game/items.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-items', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_returns_items_ordered_by_id(self):
        """Test that items are returned ordered by id."""
        first = GameItemFactory(game=self.game, name='First Item')
        second = GameItemFactory(game=self.game, name='Second Item')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


class TestGameItemsCreate(TokenAuthRequestMixin, TestCase):
    """Tests for POST /games/<slug>/items.json (issue #784)."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player of the game, and an unrelated user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.other_user = UserFactory(username='other', password='secret-password')

    def _url(self, game_slug='test-game'):
        """Return the items list/create URL for the given game slug."""
        return f'/games/{game_slug}/items.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a game item, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_dm_can_create_item(self):
        """Test that the game's DM can create a bare GameItem."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            self.client, {'name': 'Sting', 'description': 'A glowing blade.', 'hidden': True},
            token=token,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'Sting'
        assert data['description'] == 'A glowing blade.'
        assert data['hidden'] is True
        assert data['photo_path'] is None

    def test_create_persists_only_game_item(self):
        """Test that the create endpoint persists a GameItem and no CharacterItem."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(
            self.client, {'name': 'Sting', 'description': 'A glowing blade.'}, token=token,
        )
        data = json.loads(response.content)
        game_item = GameItem.objects.get(id=data['id'])
        assert game_item.game == self.game
        assert game_item.name == 'Sting'
        assert game_item.description == 'A glowing blade.'
        assert not CharacterItem.objects.filter(game_item=game_item).exists()

    def test_create_defaults_description_and_hidden(self):
        """Test that description defaults to '' and hidden defaults to False."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'Sting'}, token=token)
        data = json.loads(response.content)
        assert data['description'] == ''
        assert data['hidden'] is False

    def test_superuser_can_create_item(self):
        """Test that a superuser can create a bare GameItem."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(self.client, {'name': 'Sting'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_item(self):
        """Test that a global Staff account can create a bare GameItem."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(self.client, {'name': 'Sting'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self):
        """Test that a request without a token is rejected with 401."""
        response = self._post(self.client, {'name': 'Sting'})
        assert response.status_code == 401

    def test_regular_player_returns_403(self):
        """Test that a regular player of the game is rejected with 403."""
        token = Token.objects.create(user=self.player_user)
        response = self._post(self.client, {'name': 'Sting'}, token=token)
        assert response.status_code == 403

    def test_unrelated_user_returns_403(self):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(self.client, {'name': 'Sting'}, token=token)
        assert response.status_code == 403

    def test_missing_name_returns_400(self):
        """Test that a missing name returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_blank_name_returns_400(self):
        """Test that a blank name returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': ''}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_name_too_long_returns_400(self):
        """Test that a name longer than 200 chars returns 400."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'x' * 201}, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_returns_404_for_unknown_game_slug(self):
        """Test that a non-existent game slug returns 404."""
        token = Token.objects.create(user=self.dm_user)
        response = self.post(
            self.client, self._url(game_slug='unknown-game'), {'name': 'Sting'}, token=token,
        )
        assert response.status_code == 404
