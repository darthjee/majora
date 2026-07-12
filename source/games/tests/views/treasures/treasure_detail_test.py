"""Tests for the treasure detail view (GET detail / PATCH update)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import DetailNotFoundBehaviorMixin, TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


class TestTreasureDetailView(DetailNotFoundBehaviorMixin, TestCase):
    """Tests for the GET /treasures/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a treasure for testing."""
        cls.treasure = TreasureFactory(name='Enchanted Bow', value=750)

    def test_returns_treasure_detail(self):
        """Test that treasure detail is returned for a valid id."""
        self.assert_returns_detail(
            self.client,
            f'/treasures/{self.treasure.id}.json',
            id=self.treasure.id, name='Enchanted Bow', value=750,
        )

    def test_returns_404_for_unknown_id(self):
        """Test that 404 is returned for a non-existent treasure id."""
        self.assert_returns_not_found(self.client, '/treasures/999999.json')

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-detail', kwargs={'treasure_id': self.treasure.id})
        response = self.client.get(url)
        assert response.status_code == 200


class TestTreasureDetailPatchView(TokenAuthRequestMixin, TestCase):
    """Tests for the PATCH /treasures/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a treasure, a superuser, and a regular user."""
        cls.treasure = TreasureFactory(name='Old Helmet', value=80)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _patch(self, client, payload, token=None):
        """Issue a PATCH request to the treasure detail endpoint, optionally with a token."""
        return self.patch(client, f'/treasures/{self.treasure.id}.json', payload, token=token)

    def test_superuser_can_patch(self):
        """Test that a superuser can update a treasure and receives 200."""
        response = self._patch(self.client, {'name': 'New Helmet'}, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'New Helmet'

    def test_patch_persists_changes(self):
        """Test that the PATCH changes are persisted in the database."""
        self._patch(
            self.client, {'name': 'Updated Helmet', 'value': 90}, token=self.superuser_token
        )
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Updated Helmet'
        assert self.treasure.value == 90

    def test_patch_without_token_returns_401(self):
        """Test that PATCH without a token returns 401."""
        response = self._patch(self.client, {'name': 'Hacked Helmet'})
        assert response.status_code == 401

    def test_patch_with_non_superuser_returns_403(self):
        """Test that PATCH from a non-superuser returns 403."""
        response = self._patch(self.client, {'name': 'Hacked Helmet'}, token=self.regular_token)
        assert response.status_code == 403

    def test_patch_non_existent_treasure_returns_404(self):
        """Test that PATCH on a non-existent treasure returns 404."""
        response = self.patch(
            self.client, '/treasures/999999.json', {'name': 'Ghost'}, token=self.superuser_token
        )
        assert response.status_code == 404

    def test_patch_partial_body_only_changes_given_fields(self):
        """Test that a partial PATCH only updates the provided field."""
        self._patch(self.client, {'name': 'Partial Update'}, token=self.superuser_token)
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Partial Update'
        assert self.treasure.value == 80

    def test_patch_with_dm_of_owning_game_returns_403(self):
        """Test that PATCH is still rejected with 403 for the DM of the treasure's game."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        self.treasure.game = game
        self.treasure.save()
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        dm_token = Token.objects.create(user=dm_user)
        response = self._patch(self.client, {'name': 'Hacked Helmet'}, token=dm_token)
        assert response.status_code == 403
        self.treasure.refresh_from_db()
        assert self.treasure.name == 'Old Helmet'
