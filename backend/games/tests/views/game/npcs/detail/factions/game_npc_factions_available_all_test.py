"""Tests for the DM-only NPC factions/available/all.json view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterFaction
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactionFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcFactionsAvailableAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/factions/available/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, an NPC, and an enlisted/available faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.enlisted_faction = GameFactionFactory(game=self.game, name='Enlisted Faction')
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.enlisted_faction,
        )
        self.available_faction = GameFactionFactory(game=self.game, name='Available Faction')

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the factions/available/all URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/factions/available/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_user(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_excluding_enlisted(self, client):
        """Test that a DM sees the catalog minus already-enlisted factions."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [faction['name'] for faction in data]
        assert 'Enlisted Faction' not in names
        assert 'Available Faction' in names

    def test_superuser_gets_200(self, client):
        """Test that a superuser gets 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-factions-available-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
