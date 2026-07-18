"""Tests for the game_treasure_link view (DM/superuser only)."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameTreasureFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


class TestGameTreasureLinkView(TokenAuthRequestMixin, TestCase):
    """Tests for the POST /games/<slug>/treasures/link.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a superuser, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _post(self, payload, token=None, game_slug=None):
        """Issue a POST request to the game treasure link endpoint, optionally with a token."""
        url = f'/games/{game_slug or self.game.game_slug}/treasures/link.json'
        return self.post(self.client, url, payload, token=token)

    def test_returns_401_for_unauthenticated(self):
        """Test that unauthenticated request returns 401."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post({'treasure_id': treasure.id, 'value': 100})
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self):
        """Test that an authenticated user who is not a DM gets 403."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post(
            {'treasure_id': treasure.id, 'value': 100}, token=self.regular_token,
        )
        assert response.status_code == 403

    def test_dm_can_link_treasure_and_receives_201(self):
        """Test that a DM of the game can link a treasure and receives 201."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post({'treasure_id': treasure.id, 'value': 100}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_link_treasure_and_receives_201(self):
        """Test that a superuser can link a treasure and receives 201."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post(
            {'treasure_id': treasure.id, 'value': 100}, token=self.superuser_token,
        )
        assert response.status_code == 201

    def test_creates_game_treasure_row_with_value(self):
        """Test that a GameTreasure row is created with the posted value."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        self._post({'treasure_id': treasure.id, 'value': 250}, token=self.dm_token)
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.value == 250

    def test_creates_game_treasure_row_with_max_units(self):
        """Test that a GameTreasure row persists the posted max_units."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        self._post(
            {'treasure_id': treasure.id, 'value': 100, 'max_units': 5}, token=self.dm_token,
        )
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.max_units == 5

    def test_creates_game_treasure_row_with_hidden(self):
        """Test that a GameTreasure row persists the posted hidden flag."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        self._post(
            {'treasure_id': treasure.id, 'value': 100, 'hidden': True}, token=self.dm_token,
        )
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.hidden is True

    def test_hidden_and_max_units_default_when_omitted(self):
        """Test that hidden defaults to False and max_units defaults to None when omitted."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        self._post({'treasure_id': treasure.id, 'value': 100}, token=self.dm_token)
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.hidden is False
        assert game_treasure.max_units is None

    def test_returns_400_when_treasure_id_does_not_exist(self):
        """Test that a nonexistent treasure_id returns 400."""
        response = self._post({'treasure_id': 999999, 'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'treasure_id' in data['errors']

    def test_returns_400_when_game_type_does_not_match(self):
        """Test that a treasure with a different game_type than the game returns 400."""
        treasure = TreasureFactory(game_type='deadlands')
        response = self._post({'treasure_id': treasure.id, 'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'treasure_id' in data['errors']
        assert not GameTreasure.objects.filter(game=self.game, treasure=treasure).exists()

    def test_returns_400_when_treasure_already_linked_via_m2m(self):
        """Test that a treasure already linked to the game (M2M) returns 400."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        GameTreasureFactory(game=self.game, treasure=treasure, value=treasure.value)
        response = self._post({'treasure_id': treasure.id, 'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'treasure_id' in data['errors']

    def test_returns_400_when_treasure_already_exclusive_to_this_game(self):
        """Test that a treasure exclusive to this game (with its own GameTreasure) returns 400."""
        treasure = TreasureFactory(game_type=self.game.game_type, game=self.game)
        GameTreasureFactory(game=self.game, treasure=treasure, value=treasure.value)
        response = self._post({'treasure_id': treasure.id, 'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'treasure_id' in data['errors']

    def test_returns_400_for_non_boolean_hidden_value(self):
        """Test that a non-boolean hidden value is rejected with 400 rather than coerced."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post(
            {'treasure_id': treasure.id, 'value': 100, 'hidden': 'maybe'}, token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'hidden' in data['errors']
        assert not GameTreasure.objects.filter(game=self.game, treasure=treasure).exists()

    def test_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        treasure = TreasureFactory(game_type=self.game.game_type)
        response = self._post(
            {'treasure_id': treasure.id, 'value': 100},
            token=self.dm_token,
            game_slug='unknown-game',
        )
        assert response.status_code == 404

    def test_response_matches_treasure_detail_shape(self):
        """Test that the response body matches TreasureDetailSerializer's shape."""
        treasure = TreasureFactory(name='Catalog Gem', value=100, game_type=self.game.game_type)
        response = self._post(
            {'treasure_id': treasure.id, 'value': 250}, token=self.dm_token,
        )
        data = json.loads(response.content)
        assert data['id'] == treasure.id
        assert data['name'] == 'Catalog Gem'
        assert data['value'] == 250
        assert data['game_slug'] is None
        assert data['game_type'] == self.game.game_type
