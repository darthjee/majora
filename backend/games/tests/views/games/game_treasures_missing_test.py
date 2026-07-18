"""Tests for the game_treasures_missing view (DM/superuser only)."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameTreasureFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)

TREASURES_MISSING_URL = '/games/test-game/treasures/missing.json'


class TestGameTreasuresMissingView(TokenAuthRequestMixin, TestCase):
    """Tests for the game_treasures_missing endpoint (DM/superuser only)."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

    def _get(self, client, token=None, url=None):
        """Issue a GET request to the treasures/missing endpoint, optionally with a token."""
        return self.get(client, url or TREASURES_MISSING_URL, token=token)

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

    def test_returns_200_for_dm(self):
        """Test that a DM of the game gets 200."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200

    def test_returns_200_for_superuser(self):
        """Test that a superuser gets 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token)
        assert response.status_code == 200

    def test_returns_404_for_unknown_game(self):
        """Test that 404 is returned for a non-existent game_slug."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(
            self.client, token=token, url='/games/unknown-game/treasures/missing.json',
        )
        assert response.status_code == 404

    def test_includes_unlinked_catalog_treasure_with_matching_game_type(self):
        """Test that an unlinked catalog treasure with a matching game_type is included."""
        TreasureFactory(name='Catalog Gem', value=100, game_type=self.game.game_type)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Catalog Gem' in names

    def test_excludes_treasure_already_linked_to_this_game(self):
        """Test that a treasure with an existing GameTreasure row for this game is excluded."""
        treasure = TreasureFactory(name='Linked Gem', value=100, game_type=self.game.game_type)
        GameTreasureFactory(game=self.game, treasure=treasure, value=treasure.value)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Linked Gem' not in names

    def test_excludes_treasure_exclusive_to_a_different_game(self):
        """Test that a treasure exclusive to another game is excluded, even matching game_type."""
        other_game = GameFactory(
            name='Other Game', game_slug='other-game', game_type=self.game.game_type,
        )
        TreasureFactory(
            name='Other Exclusive Gem', value=100, game_type=self.game.game_type, game=other_game,
        )
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Other Exclusive Gem' not in names

    def test_excludes_treasure_of_a_different_game_type(self):
        """Test that a catalog treasure of a different game_type is excluded."""
        TreasureFactory(name='Deadlands Gem', value=100, game_type='deadlands')
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Deadlands Gem' not in names

    def test_response_includes_pagination_headers(self):
        """Test that the response includes page/pages/per_page/total headers."""
        TreasureFactory(name='Catalog Gem', value=100, game_type=self.game.game_type)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '1'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            TreasureFactory(
                name=f'Catalog Gem {i}', value=100, game_type=self.game.game_type,
            )
        token = Token.objects.create(user=self.dm_user)
        response = self._get(
            self.client, token=token, url=f'{TREASURES_MISSING_URL}?per_page=2',
        )
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_x_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response['X-Skip-Cache'] == 'true'
