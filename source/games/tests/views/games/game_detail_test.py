"""Tests for the game detail view (GET detail / PATCH update)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import Link
from games.tests.behaviors import DetailNotFoundBehaviorMixin, TokenAuthRequestMixin
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


@pytest.mark.django_db
class TestGameDetailView(DetailNotFoundBehaviorMixin):
    """Tests for the game detail endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')

    def test_returns_game_detail(self, client):
        """Test that game detail is returned for a valid game_slug."""
        self.assert_returns_detail(
            client, '/games/epic-quest.json', name='Epic Quest', game_slug='epic-quest'
        )

    def test_returns_description_field(self, client):
        """Test that description is included in the detail response."""
        self.game.description = 'A heroic adventure in Middle Earth.'
        self.game.save()
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == 'A heroic adventure in Middle Earth.'

    def test_description_is_empty_string_when_not_set(self, client):
        """Test that description defaults to empty string."""
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == ''

    def test_returns_404_for_unknown_slug(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        self.assert_returns_not_found(client, '/games/unknown-game.json')

    def test_includes_links(self, client):
        """Test that game detail includes associated links."""
        Link.objects.create(
            text='Rulebook', url='http://example.com/rules', content_object=self.game
        )
        response = client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert len(data['links']) == 1
        assert data['links'][0]['text'] == 'Rulebook'


@pytest.mark.django_db
class TestGameDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH game detail endpoint."""

    def setup_method(self):
        """Set up a game, a DM, and a non-DM user."""
        self.game = GameFactory(
            name='Epic Quest',
            game_slug='epic-quest',
            description='Original description.',
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the game detail endpoint, optionally with a token."""
        return self.patch(client, '/games/epic-quest.json', payload, token=token)

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(client, {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_non_dm_user_returns_403(self, client):
        """Test that PATCH from a regular non-DM user is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'name': 'New Name'}, token=token)
        assert response.status_code == 403
        self.game.refresh_from_db()
        assert self.game.name == 'Epic Quest'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the game and returns 200."""
        response = self._patch(
            client,
            {
                'name': 'Updated Quest',
                'description': 'Updated description.',
            },
            token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Updated Quest'
        assert data['description'] == 'Updated description.'
        self.game.refresh_from_db()
        assert self.game.name == 'Updated Quest'

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the game and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'name': 'Super Quest'}, token=token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Super Quest'

    def test_patch_with_invalid_payload_returns_400(self, client):
        """Test that an invalid payload is rejected with 400."""
        response = self._patch(
            client, {'name': 'x' * 201}, token=self.dm_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_does_not_change_game_slug(self, client):
        """Test that game_slug is not changed even if included in the payload."""
        response = self._patch(
            client, {'name': 'New Name', 'game_slug': 'hacked-slug'}, token=self.dm_token
        )
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.game_slug == 'epic-quest'

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body only updates the provided field."""
        response = self._patch(client, {'name': 'Partial Update'}, token=self.dm_token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Partial Update'
        assert self.game.description == 'Original description.'
