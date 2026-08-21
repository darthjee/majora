"""Tests for the NPC faction detail/full.json view (dm/admin only; incl. hidden)."""

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
class TestGameNpcFactionDetailFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/factions/<faction_id>/full.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, and an NPC with a hidden faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        game_faction = GameFactionFactory(game=self.game, name='Hidden Faction')
        self.hidden_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=game_faction, hidden=True,
        )

    def _url(self, faction_id=None, character_id=None, game_slug='test-game'):
        """Return the faction detail/full URL for the given faction (defaults to fixture)."""
        faction_id = faction_id if faction_id is not None else self.hidden_faction.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/factions/{faction_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_user(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_for_hidden_faction(self, client):
        """Test that the game's DM gets 200 for a hidden faction."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_superuser_gets_200_for_hidden_faction(self, client):
        """Test that a superuser gets 200 for a hidden faction."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a non-existent faction id."""
        response = self.get(client, self._url(faction_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-faction-detail-full',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'faction_id': self.hidden_faction.id,
            },
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
