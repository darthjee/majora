"""Tests for the game faction detail view (GET detail / PATCH update)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    FactionFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGameFactionDetailView(TestCase):
    """Tests for the GET /games/<slug>/factions/<faction_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, faction_id, game_slug='test-game'):
        """Return the faction detail URL for the given faction (defaults to fixture)."""
        return f'/games/{game_slug}/factions/{faction_id}.json'

    def test_returns_id_name_photo_path_fields(self):
        """Test that the detail response includes id, name, and photo_path."""
        faction = FactionFactory(game=self.game, name='The Silver Hand')
        response = self.client.get(self._url(faction.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == faction.id
        assert data['name'] == 'The Silver Hand'
        assert data['photo_path'] is None

    def test_returns_404_for_unknown_faction(self):
        """Test that 404 is returned for a non-existent faction id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_faction_in_wrong_game(self):
        """Test that 404 is returned when the faction belongs to a different game."""
        faction = FactionFactory(game=self.other_game, name='The Iron Circle')
        response = self.client.get(self._url(faction.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        faction = FactionFactory(game=self.game, name='The Silver Hand')
        response = self.client.get(self._url(faction.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        faction = FactionFactory(game=self.game, name='The Silver Hand')
        url = reverse(
            'game-faction-detail',
            kwargs={'game_slug': 'test-game', 'faction_id': faction.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGameFactionDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/factions/<faction_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a player, an unrelated user, and a faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.faction = FactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, faction_id=None, game_slug='test-game'):
        """Return the faction detail URL for the given faction (defaults to fixture)."""
        faction_id = faction_id if faction_id is not None else self.faction.id
        return f'/games/{game_slug}/factions/{faction_id}.json'

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self.patch(client, self._url(), {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from a non-dm/admin user is rejected with 403."""
        response = self.patch(
            client, self._url(), {'name': 'New Name'}, token=self.other_token,
        )
        assert response.status_code == 403
        self.faction.refresh_from_db()
        assert self.faction.name == 'The Silver Hand'

    def test_patch_with_dm_token_returns_200(self, client):
        """Test that PATCH from a DM's token updates the faction and returns 200."""
        response = self.patch(
            client, self._url(), {'name': 'The Golden Hand'}, token=self.dm_token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'The Golden Hand'
        self.faction.refresh_from_db()
        assert self.faction.name == 'The Golden Hand'

    def test_patch_with_superuser_token_returns_200(self, client):
        """Test that PATCH from a superuser's token updates the faction and returns 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'Super Hand'}, token=token)
        assert response.status_code == 200
        self.faction.refresh_from_db()
        assert self.faction.name == 'Super Hand'

    def test_staff_user_returns_200(self, client):
        """Test that an is_staff=True user unrelated to the game can PATCH the faction."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'Staff Hand'}, token=token)
        assert response.status_code == 200
        self.faction.refresh_from_db()
        assert self.faction.name == 'Staff Hand'

    def test_player_of_game_returns_200(self, client):
        """Test that a player of the game can PATCH the faction."""
        response = self.patch(
            client, self._url(), {'name': 'Player Hand'}, token=self.player_token,
        )
        assert response.status_code == 200
        self.faction.refresh_from_db()
        assert self.faction.name == 'Player Hand'

    def test_patch_blank_name_returns_400(self, client):
        """Test that a blank name is rejected with 400 — Faction has no fallback."""
        response = self.patch(client, self._url(), {'name': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_duplicate_name_in_same_game_returns_400(self, client):
        """Test that renaming to a name already used by another faction in the game is rejected."""
        FactionFactory(game=self.game, name='The Iron Circle')
        response = self.patch(
            client, self._url(), {'name': 'The Iron Circle'}, token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_patch_partial_body_only_changes_name(self, client):
        """Test that a partial PATCH body of the same name leaves the faction unaffected."""
        response = self.patch(
            client, self._url(), {'name': 'The Silver Hand'}, token=self.dm_token,
        )
        assert response.status_code == 200
        self.faction.refresh_from_db()
        assert self.faction.name == 'The Silver Hand'

    def test_patch_returns_404_for_unknown_faction(self, client):
        """Test that PATCH on a non-existent faction id returns 404."""
        response = self.patch(
            client, self._url(faction_id=99999), {'name': 'New Name'}, token=self.dm_token,
        )
        assert response.status_code == 404
