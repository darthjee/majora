"""Tests for the game detail view (GET detail / PATCH update)."""

import json

from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import GameSession, Link
from games.tests.behaviors import DetailNotFoundBehaviorMixin, TokenAuthRequestMixin
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


class TestGameDetailView(DetailNotFoundBehaviorMixin, TestCase):
    """Tests for the game detail endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')

    def test_returns_game_detail(self):
        """Test that game detail is returned for a valid game_slug."""
        self.assert_returns_detail(
            self.client, '/games/epic-quest.json', name='Epic Quest', game_slug='epic-quest'
        )

    def test_returns_description_field(self):
        """Test that description is included in the detail response."""
        self.game.description = 'A heroic adventure in Middle Earth.'
        self.game.save()
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == 'A heroic adventure in Middle Earth.'

    def test_description_is_empty_string_when_not_set(self):
        """Test that description defaults to empty string."""
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['description'] == ''

    def test_returns_game_type_field(self):
        """Test that game_type is included in the detail response."""
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['game_type'] == 'dnd'

    def test_returns_404_for_unknown_slug(self):
        """Test that 404 is returned for a non-existent game_slug."""
        self.assert_returns_not_found(self.client, '/games/unknown-game.json')

    def test_includes_links(self):
        """Test that game detail includes associated links."""
        Link.objects.create(
            text='Rulebook', url='http://example.com/rules', content_object=self.game
        )
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert len(data['links']) == 1
        assert data['links'][0]['text'] == 'Rulebook'

    def test_next_session_is_none_when_no_sessions(self):
        """Test that next_session is null when the game has no sessions."""
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['next_session'] is None

    def test_next_session_serializes_date_as_iso_string(self):
        """Test that next_session's date is rendered as an ISO date string in JSON."""
        today = timezone.now().date()
        GameSession.objects.create(game=self.game, title='Upcoming Session', date=today)
        response = self.client.get('/games/epic-quest.json')
        data = json.loads(response.content)
        assert data['next_session'] == {
            'title': 'Upcoming Session', 'date': today.isoformat(),
        }


class TestGameDetailPatchView(TokenAuthRequestMixin, TestCase):
    """Tests for the PATCH game detail endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, and a non-DM user."""
        cls.game = GameFactory(
            name='Epic Quest',
            game_slug='epic-quest',
            description='Original description.',
        )
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the game detail endpoint, optionally with a token."""
        return self.patch(client, '/games/epic-quest.json', payload, token=token)

    def test_patch_without_token_returns_401(self):
        """Test that PATCH without a token is rejected with 401."""
        response = self._patch(self.client, {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_non_dm_user_returns_403(self):
        """Test that PATCH from a regular non-DM user is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(self.client, {'name': 'New Name'}, token=token)
        assert response.status_code == 403
        self.game.refresh_from_db()
        assert self.game.name == 'Epic Quest'

    def test_patch_with_dm_token_returns_200(self):
        """Test that PATCH from a DM's token updates the game and returns 200."""
        response = self._patch(
            self.client,
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

    def test_patch_with_superuser_token_returns_200(self):
        """Test that PATCH from a superuser's token updates the game and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(self.client, {'name': 'Super Quest'}, token=token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Super Quest'

    def test_patch_with_invalid_payload_returns_400(self):
        """Test that an invalid payload is rejected with 400."""
        response = self._patch(
            self.client, {'name': 'x' * 201}, token=self.dm_token
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_does_not_change_game_slug(self):
        """Test that game_slug is not changed even if included in the payload."""
        response = self._patch(
            self.client, {'name': 'New Name', 'game_slug': 'hacked-slug'}, token=self.dm_token
        )
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.game_slug == 'epic-quest'

    def test_patch_partial_body_only_changes_given_fields(self):
        """Test that a partial PATCH body only updates the provided field."""
        response = self._patch(self.client, {'name': 'Partial Update'}, token=self.dm_token)
        assert response.status_code == 200
        self.game.refresh_from_db()
        assert self.game.name == 'Partial Update'
        assert self.game.description == 'Original description.'
