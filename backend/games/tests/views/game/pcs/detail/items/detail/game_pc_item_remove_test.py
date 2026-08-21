"""Tests for the PC item remove endpoint."""

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
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcItemRemoveView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/items/remove.json."""

    def setup_method(self):
        """Set up a game, a PC owning an item, an owning player/user, and a DM."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Aragorn Player')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.game_item = GameItemFactory(game=self.game, name='Sting')
        self.character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the remove endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/items/remove.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the remove endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_remove_item(self, client):
        """Test that an authorized editor can remove an owned item."""
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self._editor_token(),
        )
        assert response.status_code == 204

    def test_remove_deletes_character_item_row(self, client):
        """Test that removing deletes the CharacterItem row."""
        self._post(client, {'game_item_id': self.game_item.id}, token=self._editor_token())
        assert not CharacterItem.objects.filter(id=self.character_item.id).exists()

    def test_removing_never_owned_item_returns_404(self, client):
        """Test that removing a game item never owned by the character returns 404."""
        other_item = GameItemFactory(game=self.game, name='Orb')
        response = self._post(
            client, {'game_item_id': other_item.id}, token=self._editor_token(),
        )
        assert response.status_code == 404

    def test_removing_hidden_owned_item_returns_404_via_public_endpoint(self, client):
        """Test that removing an owned-but-hidden item 404s via the public endpoint."""
        hidden_item = GameItemFactory(game=self.game, name='Secret Ring')
        hidden_character_item = CharacterItem.objects.create(
            character=self.character, game_item=hidden_item, hidden=True,
        )
        response = self._post(
            client, {'game_item_id': hidden_item.id}, token=self.dm_token,
        )
        assert response.status_code == 404
        assert CharacterItem.objects.filter(id=hidden_character_item.id).exists()

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'game_item_id': self.game_item.id})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self.other_token,
        )
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(
            client, {'game_item_id': self.game_item.id},
            token=self._editor_token(), game_slug='no-such-game',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'game_item_id': self.game_item.id},
            token=self._editor_token(), character_id=99999,
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self._post(
            client, {'game_item_id': self.game_item.id},
            token=self._editor_token(), character_id=other.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-item-remove',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_item_id': self.game_item.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 204

    def test_dm_can_remove_item(self, client):
        """Test that a DM of the game can remove an item on behalf of a PC."""
        response = self._post(client, {'game_item_id': self.game_item.id}, token=self.dm_token)
        assert response.status_code == 204

    def test_staff_can_remove_item(self, client):
        """Test that a global Staff user, neither owner nor DM, can remove an item for a PC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(client, {'game_item_id': self.game_item.id}, token=staff_token)
        assert response.status_code == 204

    def test_missing_game_item_id_returns_400(self, client):
        """Test that a missing game_item_id returns 400."""
        response = self._post(client, {}, token=self._editor_token())
        assert response.status_code == 400
