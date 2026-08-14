"""Tests for the game faction characters/all.json view (DM/superuser only, includes hidden)."""

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
class TestGameFactionCharactersAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/factions/<faction_id>/characters/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, a faction, and visible/hidden members."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        self.visible_character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        CharacterFaction.objects.create(
            character=self.visible_character, game_faction=self.game_faction,
        )
        self.hidden_character = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        CharacterFaction.objects.create(
            character=self.hidden_character, game_faction=self.game_faction,
        )

    def _url(self, faction_id=None, game_slug='test-game'):
        """Return the faction characters/all URL (defaults to the fixture faction)."""
        faction_id = faction_id if faction_id is not None else self.game_faction.id
        return f'/games/{game_slug}/factions/{faction_id}/characters/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_user(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_with_both_visible_and_hidden_characters(self, client):
        """Test that a DM sees both visible and hidden members."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [character['name'] for character in data]
        assert 'Aragorn' in names
        assert 'Secret NPC' in names

    def test_superuser_gets_200(self, client):
        """Test that a superuser gets 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_always_sets_x_skip_cache_header(self, client):
        """Test that the response always sets X-Skip-Cache: true."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_faction(self, client):
        """Test that 404 is returned for a faction not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_faction = GameFactionFactory(game=other_game, name='Foreign Faction')
        response = self.get(
            client, self._url(faction_id=other_faction.id), token=self.dm_token,
        )
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-faction-characters-all',
            kwargs={'game_slug': 'test-game', 'faction_id': self.game_faction.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
