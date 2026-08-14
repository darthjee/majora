"""Tests for the DM-only NPC faction acquire-all endpoint (bypasses hidden-character gate)."""

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
class TestGameNpcFactionAcquireAllView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/factions/acquire/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, a hidden NPC, and a game faction."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire-all endpoint URL for the given character/game."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/factions/acquire/all.json'

    def _post(self, client, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire-all endpoint, optionally with a token."""
        return self.post(
            client, self._url(character_id, game_slug),
            {'game_faction_id': self.game_faction.id}, token=token,
        )

    def test_dm_can_acquire_a_faction_for_a_hidden_npc(self, client):
        """Test that a DM can enlist a hidden NPC into a faction via the all-variant."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_acquire_a_faction(self, client):
        """Test that a superuser can enlist a hidden NPC into a faction via the all-variant."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, token=token)
        assert response.status_code == 201

    def test_acquire_creates_character_faction_row(self, client):
        """Test that acquiring still creates the CharacterFaction row."""
        self._post(client, token=self.dm_token)
        assert CharacterFaction.objects.filter(
            character=self.character, game_faction=self.game_faction,
        ).exists()

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client)
        assert response.status_code == 401

    def test_non_dm_authenticated_user_returns_403(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self._post(client, token=self.other_token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(client, token=self.dm_token, game_slug='no-such-game')
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(client, token=self.dm_token, character_id=99999)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-faction-acquire-all',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_faction_id': self.game_faction.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 201
