"""Tests for the game_treasures_all view (DM/superuser only, includes hidden treasures)."""

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

TREASURES_ALL_URL = '/games/test-game/treasures/all.json'


class TestGameTreasuresAllView(TokenAuthRequestMixin, TestCase):
    """Tests for the game_treasures_all endpoint (DM/superuser only, includes hidden)."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.visible_treasure = TreasureFactory(name='Visible Gem', value=100, game=cls.game)
        GameTreasureFactory(
            game=cls.game, treasure=cls.visible_treasure, value=cls.visible_treasure.value,
        )
        cls.hidden_treasure = TreasureFactory(name='Hidden Gem', value=100, game=cls.game)
        GameTreasureFactory(
            game=cls.game, treasure=cls.hidden_treasure, value=cls.hidden_treasure.value,
            hidden=True,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the treasures/all endpoint, optionally with a token."""
        return self.get(client, TREASURES_ALL_URL, token=token)

    def test_returns_401_for_unauthenticated(self):
        """Test that unauthenticated request returns 401."""
        response = self._get(self.client)
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self):
        """Test that an authenticated user who is not a DM gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 403

    def test_returns_200_for_dm_with_all_treasures(self):
        """Test that a DM gets 200 with both visible and hidden treasures."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_returns_200_for_superuser_with_all_treasures(self):
        """Test that a superuser gets 200 with both visible and hidden treasures."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(self.client, '/games/unknown-game/treasures/all.json', token=token)
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self):
        """Test that the response includes page/pages/per_page/total headers."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '2'

    def test_response_includes_x_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_available_units_and_max_units_reflect_the_game_treasure_row(self):
        """Test that available_units/max_units reflect the linked GameTreasure row's cap."""
        linked_treasure = TreasureFactory(name='Limited Gem', value=100)
        self.game.treasures.add(linked_treasure, through_defaults={'value': linked_treasure.value})
        GameTreasure.objects.filter(game=self.game, treasure=linked_treasure).update(
            max_units=5, acquired_units=2,
        )
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        item = next(item for item in data if item['name'] == 'Limited Gem')
        assert item['max_units'] == 5
        assert item['available_units'] == 3

    def test_does_not_include_other_games_treasures(self):
        """Test that treasures exclusive/linked to a different game are excluded."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_treasure = TreasureFactory(name='Other Game Gem', value=100, game=other_game)
        GameTreasureFactory(
            game=other_game, treasure=other_treasure, value=other_treasure.value, hidden=True,
        )
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Other Game Gem' not in names

    def test_response_includes_hidden_field_per_item(self):
        """Test that each item in the response carries its own hidden flag."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        by_name = {item['name']: item['hidden'] for item in data}
        assert by_name['Visible Gem'] is False
        assert by_name['Hidden Gem'] is True

    def test_filters_by_min_value(self):
        """Test that only treasures with value >= min_value are returned."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?min_value=150', token=token,
        )
        data = json.loads(response.content)
        assert data == []

    def test_filters_by_max_value(self):
        """Test that only treasures with value <= max_value are returned."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?max_value=50', token=token,
        )
        data = json.loads(response.content)
        assert data == []

    def test_min_and_max_value_combined(self):
        """Test that min_value and max_value filters both apply together."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?min_value=50&max_value=150', token=token,
        )
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_filters_by_name(self):
        """Test that only treasures whose name contains the name term are returned."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?name=Visible', token=token,
        )
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible Gem'

    def test_name_filter_is_case_insensitive(self):
        """Test that the name filter matches regardless of case."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?name=visible gem', token=token,
        )
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible Gem'

    def test_uses_game_treasure_value_not_treasure_value_for_min_and_max(self):
        """Test that min_value/max_value filter on GameTreasure.value, not Treasure.value."""
        treasure = TreasureFactory(name='Discounted Gem', value=500, game=self.game)
        GameTreasureFactory(game=self.game, treasure=treasure, value=50)
        token = Token.objects.create(user=self.dm_user)
        response = self.get(
            self.client, f'{TREASURES_ALL_URL}?max_value=60', token=token,
        )
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert names == ['Discounted Gem']
