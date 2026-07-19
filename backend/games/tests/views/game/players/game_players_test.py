"""Tests for the game players list view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGamePlayersView(TestCase):
    """Tests for the GET /games/<slug>/players.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player owning a PC, a player with no user, and outsiders."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        cls.dm = PlayerFactory(name='Dungeon Master', game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', game=cls.game, user=cls.player_user)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.pc = CharacterFactory(
            name='Aragorn', game=cls.game, player=cls.player, npc=False,
        )

        cls.no_user_player = PlayerFactory(name='NPC-run Player', game=cls.game, user=None)

        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _get(self, token=None, game_slug=None, query=''):
        """Issue a GET request to the game players list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/players.json{query}'
        return self.client.get(url, **extra)

    def test_unauthenticated_get_returns_401(self):
        """Test that a GET without a token returns 401."""
        response = self._get()
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_get_returns_403(self):
        """Test that a GET from a user unrelated to the game returns 403."""
        response = self._get(token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_dm_can_list(self):
        """Test that the DM of the game can list players."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_player_can_list(self):
        """Test that a player of the game can list players."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200

    def test_superuser_cannot_list(self):
        """Test that a superuser with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 403

    def test_staff_cannot_list(self):
        """Test that a staff user with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 403

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_returns_one_entry_per_player(self):
        """Test that the response has one item per Player row in the game."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 3

    def test_dm_entry_has_null_character(self):
        """Test that a DM with no owned PC has a null character."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.dm.id)
        assert entry['character'] is None
        assert entry['user'] is not None
        assert 'display_name' in entry['user']

    def test_player_entry_has_character(self):
        """Test that a player owning a PC has a populated character field."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.player.id)
        assert entry['character'] is not None
        assert entry['character']['name'] == 'Aragorn'
        assert 'photo_url' in entry['character']

    def test_player_with_no_user_has_null_user(self):
        """Test that a Player with no linked User account has user: null."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.no_user_player.id)
        assert entry['user'] is None
        assert entry['character'] is None

    def test_returns_expected_fields(self):
        """Test that list items include only id, user, character."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert set(data[0].keys()) == {'id', 'user', 'character'}

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self._get(token=self.dm_token)
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self._get(token=self.dm_token)
        assert response['pages'] == '1'

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        response = self._get(token=self.dm_token, query='?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-players', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200

    def test_list_is_ordered_by_name(self):
        """Test that the list is ordered by Player.name (Player.Meta.ordering)."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        expected_ids = list(
            self.game.players.order_by('name').values_list('id', flat=True)
        )
        assert [item['id'] for item in data] == expected_ids

    def test_returns_only_this_games_players(self):
        """Test that players from other games are not included."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        PlayerFactory(name='Other Player', game=other_game)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 3
