"""Tests for the single game player detail view."""

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


class TestGamePlayerDetailView(TestCase):
    """Tests for the GET /games/<slug>/players/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player owning a PC, and outsiders."""
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

        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.other_player = PlayerFactory(name='Other Player', game=cls.other_game)

    def _get(self, token=None, game_slug=None, player_id=None):
        """Issue a GET request to the game player detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        game_slug = game_slug or self.game.game_slug
        player_id = self.player.id if player_id is None else player_id
        url = f'/games/{game_slug}/players/{player_id}.json'
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

    def test_superuser_get_returns_403(self):
        """Test that a superuser with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 403

    def test_staff_get_returns_403(self):
        """Test that a staff user with no game link gets 403 (no bypass, issue #695)."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 403

    def test_dm_can_view_a_player(self):
        """Test that the DM of the game can view a single player."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_player_can_view_another_player(self):
        """Test that a player of the game can view a fellow player."""
        response = self._get(token=self.player_token, player_id=self.dm.id)
        assert response.status_code == 200

    def test_returns_expected_fields(self):
        """Test that the response includes only id, user, character."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert set(data.keys()) == {'id', 'user', 'character'}

    def test_returns_player_id(self):
        """Test that the response's id matches the requested player."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['id'] == self.player.id

    def test_returns_populated_character(self):
        """Test that the response's character is populated for a player who owns a PC."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['character']['name'] == 'Aragorn'

    def test_returns_null_character_for_dm_with_no_pc(self):
        """Test that the response's character is null for a DM who owns no PC."""
        response = self._get(token=self.dm_token, player_id=self.dm.id)
        data = json.loads(response.content)
        assert data['character'] is None

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_returns_404_for_unknown_player_id(self):
        """Test that 404 is returned for a non-existent player id."""
        response = self._get(token=self.dm_token, player_id=999999)
        assert response.status_code == 404

    def test_returns_404_for_player_of_a_different_game(self):
        """Test that 404 is returned for a player id that belongs to another game."""
        response = self._get(token=self.dm_token, player_id=self.other_player.id)
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-player-detail', kwargs={'game_slug': 'test-game', 'player_id': self.player.id},
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200
