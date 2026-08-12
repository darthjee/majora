"""Tests for the game factions view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Faction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    FactionFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameFactionsView(TestCase):
    """Tests for the GET /games/<slug>/factions.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_factions(self):
        """Test that an empty list is returned when the game has no factions."""
        response = self.client.get('/games/test-game/factions.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_factions(self):
        """Test that only factions belonging to the game are returned."""
        FactionFactory(game=self.game, name='The Silver Hand')
        FactionFactory(game=self.other_game, name='The Iron Circle')
        response = self.client.get('/games/test-game/factions.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'The Silver Hand'

    def test_returns_id_name_photo_path_fields(self):
        """Test that list items include id, name, and photo_path fields."""
        faction = FactionFactory(game=self.game, name='The Silver Hand')
        response = self.client.get('/games/test-game/factions.json')
        data = json.loads(response.content)
        assert data[0]['id'] == faction.id
        assert data[0]['name'] == 'The Silver Hand'
        assert data[0]['photo_path'] is None

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/factions.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/factions.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/factions.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/factions.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            FactionFactory(game=self.game, name=f'Faction {i}')
        response = self.client.get('/games/test-game/factions.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-factions', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_returns_factions_ordered_by_id(self):
        """Test that factions are returned ordered by id."""
        first = FactionFactory(game=self.game, name='First Faction')
        second = FactionFactory(game=self.game, name='Second Faction')
        response = self.client.get('/games/test-game/factions.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


class TestGameFactionsCreate(TokenAuthRequestMixin, TestCase):
    """Tests for POST /games/<slug>/factions.json (issue #812)."""

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
        """Return the factions list/create URL for the given game slug."""
        return f'/games/{game_slug}/factions.json'

    def _post(self, client, payload, token=None):
        """Issue a POST request to create a faction, optionally with a token."""
        return self.post(client, self._url(), payload, token=token)

    def test_dm_can_create_faction(self):
        """Test that the game's DM can create a bare Faction."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['name'] == 'The Silver Hand'
        assert data['photo_path'] is None

    def test_create_persists_faction(self):
        """Test that the create endpoint persists a Faction."""
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        data = json.loads(response.content)
        faction = Faction.objects.get(id=data['id'])
        assert faction.game == self.game
        assert faction.name == 'The Silver Hand'

    def test_superuser_can_create_faction(self):
        """Test that a superuser can create a bare Faction."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        assert response.status_code == 201

    def test_staff_can_create_faction(self):
        """Test that a global Staff account can create a bare Faction."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        assert response.status_code == 201

    def test_unauthenticated_returns_401(self):
        """Test that a request without a token is rejected with 401."""
        response = self._post(self.client, {'name': 'The Silver Hand'})
        assert response.status_code == 401

    def test_regular_player_can_create_faction(self):
        """Test that a regular player of the game can create a bare Faction."""
        token = Token.objects.create(user=self.player_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        assert response.status_code == 201

    def test_unrelated_user_returns_403(self):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
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

    def test_duplicate_name_in_same_game_returns_400(self):
        """Test that creating a faction with a name already used in the game returns 400."""
        FactionFactory(game=self.game, name='The Silver Hand')
        token = Token.objects.create(user=self.dm_user)
        response = self._post(self.client, {'name': 'The Silver Hand'}, token=token)
        assert response.status_code == 400

    def test_returns_404_for_unknown_game_slug(self):
        """Test that a non-existent game slug returns 404."""
        token = Token.objects.create(user=self.dm_user)
        response = self.post(
            self.client,
            self._url(game_slug='unknown-game'),
            {'name': 'The Silver Hand'},
            token=token,
        )
        assert response.status_code == 404
