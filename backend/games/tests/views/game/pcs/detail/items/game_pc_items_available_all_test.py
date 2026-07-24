"""Tests for the DM-only PC items/available/all.json view (includes hidden items)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcItemsAvailableAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/items/available/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an owner, an owned item, and a hidden available item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player = PlayerFactory(name='Bob', game=self.game, user=self.owner)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player,
        )
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.owned_item = GameItemFactory(game=self.game, name='Owned Gem')
        CharacterItem.objects.create(character=self.character, game_item=self.owned_item)
        self.hidden_item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the items/available/all URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/items/available/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_owning_player(self, client):
        """Test that the PC's own owning player is rejected — game-level, no owner leniency."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response.status_code == 403

    def test_returns_403_for_staff(self, client):
        """Test that a global Staff user, neither DM nor superuser, gets 403."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self.get(client, self._url(), token=staff_token)
        assert response.status_code == 403

    def test_returns_403_for_unrelated_user(self, client):
        """Test that an authenticated user unrelated to the game gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_including_hidden_and_excluding_owned(self, client):
        """Test that a DM sees the hidden item but not the already-owned item."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Hidden Gem' in names
        assert 'Owned Gem' not in names

    def test_superuser_gets_200(self, client):
        """Test that a superuser gets 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_response_includes_hidden_field(self, client):
        """Test that each item carries its own hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['name'] == 'Hidden Gem')
        assert entry['hidden'] is True

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-items-available-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
