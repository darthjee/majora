"""Tests for the game-scoped treasure full.json view (DM/superuser only, includes hidden)."""

import pytest
from django.urls import reverse
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
from games.tests.views.support import assert_json_response


@pytest.mark.django_db
class TestGameTreasureFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/treasures/<treasure_id>/full.json."""

    def setup_method(self):
        """Set up a game, a DM, a player and a hidden and a visible treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.player_user = UserFactory(username='player', password='secret-password')
        PlayerFactory(game=self.game, user=self.player_user)
        self.hidden_treasure = TreasureFactory(name='Secret Idol', value=999, game=self.game)
        GameTreasureFactory(
            game=self.game, treasure=self.hidden_treasure, value=self.hidden_treasure.value,
            hidden=True,
        )
        self.visible_treasure = TreasureFactory(name='Visible Gem', value=42, game=self.game)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_token = Token.objects.create(user=self.player_user)

    def _url(self, treasure_id=None):
        """Return the full URL for the given treasure id (defaults to the hidden treasure)."""
        treasure_id = treasure_id if treasure_id is not None else self.hidden_treasure.id
        return f'/games/test-game/treasures/{treasure_id}/full.json'

    def test_returns_401_for_anonymous(self, client):
        """Test that an anonymous request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_player_on_hidden_treasure(self, client):
        """Test that a non-DM player gets 403 for a hidden treasure."""
        response = self.get(client, self._url(), token=self.player_token)
        assert response.status_code == 403

    def test_returns_403_for_player_on_missing_treasure(self, client):
        """Test that a non-DM player gets 403 for a missing id too, revealing nothing."""
        response = self.get(client, self._url(treasure_id=99999), token=self.player_token)
        assert response.status_code == 403

    def test_dm_gets_hidden_treasure_with_hidden_true(self, client):
        """Test that a DM gets a hidden treasure's detail with hidden: true."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert_json_response(response, 200, name='Secret Idol', value=999, hidden=True)

    def test_dm_gets_hidden_false_without_game_treasure_row(self, client):
        """Test that hidden is false when the treasure has no GameTreasure row."""
        url = self._url(treasure_id=self.visible_treasure.id)
        response = self.get(client, url, token=self.dm_token)
        assert_json_response(response, 200, name='Visible Gem', hidden=False)

    def test_superuser_gets_hidden_treasure(self, client):
        """Test that a superuser gets a hidden treasure's detail."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, hidden=True)

    def test_includes_detail_fields(self, client):
        """Test that the payload carries the plain detail fields plus hidden."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = assert_json_response(response, 200)
        assert set(data.keys()) == {
            'id', 'name', 'value', 'game_type', 'photo_path', 'game_slug', 'available_units',
            'max_units', 'hidden',
        }

    def test_response_sets_x_skip_cache(self, client):
        """Test that a successful response always carries X-Skip-Cache: true."""
        url = self._url(treasure_id=self.visible_treasure.id)
        response = self.get(client, url, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_dm_gets_404_for_missing_treasure(self, client):
        """Test that a DM gets 404 for an unknown treasure id."""
        response = self.get(client, self._url(treasure_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is reachable by its URL name."""
        url = reverse(
            'game-treasure-full',
            kwargs={'game_slug': 'test-game', 'treasure_id': self.hidden_treasure.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
