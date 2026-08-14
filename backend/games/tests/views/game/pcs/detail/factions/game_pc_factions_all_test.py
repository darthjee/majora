"""Tests for the PC factions/all.json view (dm, owner, or admin only; includes hidden)."""

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
class TestGamePcFactionsAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/factions/all.json."""

    def setup_method(self):
        """Set up a game, an owning player/user, a DM, an unrelated user, and a PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player = PlayerFactory(name='Bob', game=self.game, user=self.owner)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False,
        )
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.visible_faction = GameFactionFactory(game=self.game, name='Visible Faction')
        self.hidden_faction = GameFactionFactory(game=self.game, name='Hidden Faction')
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.visible_faction,
        )
        CharacterFaction.objects.create(
            character=self.character, game_faction=self.hidden_faction, hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the factions/all URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/factions/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_owner_non_dm_user(self, client):
        """Test that an authenticated user who is not the owner/DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_owner_gets_200_with_both_visible_and_hidden_factions(self, client):
        """Test that the PC's owning player gets 200 with both visible and hidden factions."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [faction['name'] for faction in data]
        assert 'Visible Faction' in names
        assert 'Hidden Faction' in names

    def test_dm_gets_200_with_both_visible_and_hidden_factions(self, client):
        """Test that the game's DM gets 200 with both visible and hidden factions."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_superuser_gets_200_with_both_visible_and_hidden_factions(self, client):
        """Test that a superuser gets 200 with both visible and hidden factions."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_hidden_field_per_faction(self, client):
        """Test that each faction carries its own hidden flag."""
        response = self.get(client, self._url(), token=self.owner_token)
        data = json.loads(response.content)
        by_name = {faction['name']: faction['hidden'] for faction in data}
        assert by_name['Visible Faction'] is False
        assert by_name['Hidden Faction'] is True

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.owner_token)
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-factions-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = self.get(client, url, token=self.owner_token)
        assert response.status_code == 200
