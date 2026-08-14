"""Tests for the NPC faction remove (quit) endpoint."""

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
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcFactionRemoveView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/npcs/<id>/factions/remove.json."""

    def setup_method(self):
        """Set up a game, an NPC enlisted in a faction, a DM, and an unrelated user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.plain_player_user = UserFactory(username='plain_player', password='secret-password')
        PlayerFactory(game=self.game, user=self.plain_player_user)
        self.plain_player_token = Token.objects.create(user=self.plain_player_user)
        self.game_faction = GameFactionFactory(game=self.game, name='The Silver Hand')
        self.character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )

    def _url(self, character_id=None, game_slug=None):
        """Return the remove endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/npcs/{character_id}/factions/remove.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the remove endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_dm_can_remove_faction(self, client):
        """Test that a DM of the game can remove an NPC from a faction."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.dm_token,
        )
        assert response.status_code == 204

    def test_remove_deletes_character_faction_row(self, client):
        """Test that removing deletes the CharacterFaction row."""
        self._post(client, {'game_faction_id': self.game_faction.id}, token=self.dm_token)
        assert not CharacterFaction.objects.filter(id=self.character_faction.id).exists()

    def test_removing_never_enlisted_faction_returns_404(self, client):
        """Test that removing a faction never enlisted by the character returns 404."""
        other_faction = GameFactionFactory(game=self.game, name='Iron Circle')
        response = self._post(
            client, {'game_faction_id': other_faction.id}, token=self.dm_token,
        )
        assert response.status_code == 404

    def test_staff_can_remove_faction(self, client):
        """Test that a global Staff user, not a DM, can remove an NPC from a faction."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=staff_token,
        )
        assert response.status_code == 204

    def test_plain_player_can_remove_faction(self, client):
        """Test that a plain player of the game (not staff/dm) can remove an NPC."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.plain_player_token,
        )
        assert response.status_code == 204

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'game_faction_id': self.game_faction.id})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id},
            token=self.dm_token, game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'game_faction_id': self.game_faction.id},
            token=self.dm_token, character_id=99999,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-faction-remove',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_faction_id': self.game_faction.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 204

    def test_missing_game_faction_id_returns_400(self, client):
        """Test that a missing game_faction_id returns 400."""
        response = self._post(client, {}, token=self.dm_token)
        assert response.status_code == 400
