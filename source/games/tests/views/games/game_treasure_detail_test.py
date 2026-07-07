"""Tests for the game-scoped treasure detail view (GET detail / PATCH update)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import DetailNotFoundBehaviorMixin, TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)
from games.tests.views.support import assert_json_response


@pytest.mark.django_db
class TestGameTreasureDetailView(DetailNotFoundBehaviorMixin):
    """Tests for the GET /games/<slug>/treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.treasure = TreasureFactory(
            name='Golden Crown', value=500, game=self.game
        )

    def test_returns_treasure_detail(self, client):
        """Test that treasure detail is returned for a valid treasure_id."""
        self.assert_returns_detail(
            client,
            f'/games/test-game/treasures/{self.treasure.id}.json',
            name='Golden Crown', value=500, game_slug='test-game',
        )

    def test_returns_404_for_unknown_treasure(self, client):
        """Test that 404 is returned for a non-existent treasure_id."""
        self.assert_returns_not_found(client, '/games/test-game/treasures/99999.json')

    def test_returns_404_for_treasure_in_wrong_game(self, client):
        """Test that 404 is returned when the treasure belongs to a different game."""
        self.assert_returns_not_found(
            client, f'/games/other-game/treasures/{self.treasure.id}.json'
        )

    def test_returns_404_for_globally_owned_treasure(self, client):
        """Test that 404 is returned when the treasure id belongs to a global treasure."""
        global_treasure = TreasureFactory(name='Global Gem', value=10)
        self.assert_returns_not_found(
            client, f'/games/test-game/treasures/{global_treasure.id}.json'
        )

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        self.assert_returns_not_found(
            client, f'/games/unknown-game/treasures/{self.treasure.id}.json'
        )


@pytest.mark.django_db
class TestGameTreasureUpdateView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/treasures/<id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a superuser, a regular user, and a game-exclusive treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.treasure = TreasureFactory(
            name='Golden Crown', value=500, game=self.game
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = SuperUserFactory(
            username='admin', password='secret-password'
        )
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(
            username='player', password='secret-password'
        )
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the game treasure detail endpoint, optionally with a token."""
        return self.patch(
            client, f'/games/test-game/treasures/{self.treasure.id}.json', payload, token=token
        )

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'Silver Crown'})
        assert response.status_code == 401

    def test_patch_with_regular_user_returns_403(self, client):
        """Test that PATCH from a non-DM, non-superuser is rejected with 403."""
        response = self._patch(client, {'name': 'Silver Crown'}, token=self.regular_token)
        assert response.status_code == 403
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Golden Crown'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from the game's DM is allowed."""
        response = self._patch(client, {'name': 'Silver Crown', 'value': 600}, token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Silver Crown'
        assert data['value'] == 600
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Silver Crown'
        assert self.treasure.value == 600

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token is allowed."""
        response = self._patch(client, {'name': 'Silver Crown'}, token=self.superuser_token)
        assert response.status_code == 200
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Silver Crown'

    def test_patch_returns_404_for_mismatched_game(self, client):
        """Test that PATCH returns 404 when the treasure does not belong to the game slug."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.patch(
            f'/games/other-game/treasures/{self.treasure.id}.json',
            data=json.dumps({'name': 'Silver Crown'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        response = self._patch(client, {'value': 700}, token=self.dm_token)
        assert response.status_code == 200
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Golden Crown'
        assert self.treasure.value == 700

    def test_patch_ignores_game_field(self, client):
        """Test that a game field in the payload has no effect on the treasure's game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')

        response = self._patch(
            client,
            {'name': 'Silver Crown', 'game': other_game.id},
            token=self.dm_token,
        )

        assert response.status_code == 200
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Silver Crown'
        assert self.treasure.game_id == self.game.id


@pytest.mark.django_db
class TestGameTreasureDetailHidden(TokenAuthRequestMixin):
    """Tests for the hidden-treasure visibility gate in game_treasure_detail.

    A hidden treasure's existence must not be exposed to callers who cannot edit
    the game, mirroring the hidden-NPC gate documented for character endpoints.
    """

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.hidden_treasure = TreasureFactory(
            name='Secret Idol', value=999, game=self.game, hidden=True
        )

    def _url(self, treasure=None):
        """Return the detail URL for the given treasure (defaults to the hidden treasure)."""
        treasure = treasure or self.hidden_treasure
        return f'/games/test-game/treasures/{treasure.id}.json'

    def test_hidden_treasure_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden treasure gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_treasure_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden treasure."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_treasure_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden treasure detail."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, name='Secret Idol', value=999)

    def test_hidden_treasure_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden treasure detail."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert_json_response(response, 200, name='Secret Idol', value=999)

    def test_visible_treasure_returns_200_for_anonymous(self, client):
        """Test that a non-hidden treasure is still accessible to anonymous users."""
        visible_treasure = TreasureFactory(
            name='Visible Gem', value=42, game=self.game, hidden=False
        )
        response = self.get(client, self._url(treasure=visible_treasure))
        assert response.status_code == 200

    def test_hidden_treasure_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden treasure includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_treasure_404_response_includes_x_skip_cache_header_for_anonymous(
        self, client
    ):
        """Test that an anonymous 404 response for a hidden treasure includes X-Skip-Cache."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_patch_on_hidden_treasure_by_non_dm_returns_404(self, client):
        """Test that a non-DM's PATCH attempt on a hidden treasure gets 404, not 403."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.patch(client, self._url(), {'name': 'Renamed'}, token=token)
        assert response.status_code == 404
        self.hidden_treasure.refresh_from_db()
        assert self.hidden_treasure.name == 'Secret Idol'
