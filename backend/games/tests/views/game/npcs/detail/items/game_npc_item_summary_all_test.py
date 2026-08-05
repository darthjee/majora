"""Tests for the dm/admin-only NPC item quantity summary endpoint (includes hidden)."""

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
class TestGameNpcItemSummaryAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/items/<item_id>/npcs/<character_id>/summary/all.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM, an unrelated user, and a game item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_item = GameItemFactory(game=self.game, name='Sting')

    def _url(self, item_id=None, character_id=None, game_slug=None):
        """Return the summary/all endpoint URL (defaults to fixtures)."""
        item_id = item_id if item_id is not None else self.game_item.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/items/{item_id}/npcs/{character_id}/summary/all.json'

    def test_includes_hidden_character_item_rows(self, client):
        """Test that hidden CharacterItem rows are counted in the all variant."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        CharacterItem.objects.create(
            character=self.character, game_item=self.game_item, hidden=True,
        )
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'quantity': 2}

    def test_dm_can_view_summary(self, client):
        """Test that the game's DM can view the full summary."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_can_view_summary(self, client):
        """Test that a superuser can view the full summary."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_non_dm_authenticated_user_returns_403(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_hidden_npc_reachable_by_dm(self, client):
        """Test that a hidden NPC's summary is reachable by the DM."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(client, self._url(character_id=hidden_npc.id), token=self.dm_token)
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_item(self, client):
        """Test that 404 is returned for an item id not in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_item = GameItemFactory(game=other_game, name='Orb')
        response = self.get(client, self._url(item_id=other_item.id), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'), token=self.dm_token)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-item-npc-summary-all',
            kwargs={
                'game_slug': self.game.game_slug,
                'item_id': self.game_item.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200
