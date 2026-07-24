"""Tests for the PC item acquire endpoint."""

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
class TestGamePcItemAcquireView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/items/acquire.json."""

    def setup_method(self):
        """Set up a game, a PC, a DM, an unrelated user, and an available game item."""
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

    def _editor_token(self):
        """Return the owning player's user token."""
        return Token.objects.create(user=self.owner)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire endpoint URL for the given character/game (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/items/acquire.json'

    def _post(self, client, payload, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, game_slug), payload, token=token)

    def test_editor_can_acquire_item(self, client):
        """Test that an authorized editor can acquire an existing game item."""
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self._editor_token(),
        )
        assert response.status_code == 201

    def test_acquire_creates_character_item_row(self, client):
        """Test that a CharacterItem row is created linking the character to the game item."""
        self._post(client, {'game_item_id': self.game_item.id}, token=self._editor_token())
        character_item = CharacterItem.objects.get(
            character=self.character, game_item=self.game_item,
        )
        assert character_item.name is None
        assert character_item.description is None
        assert character_item.photo is None

    def test_acquire_response_includes_expected_fields(self, client):
        """Test that the response exposes the acquired CharacterItem's detail fields."""
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['game_item_id'] == self.game_item.id
        assert data['name'] == 'Sting'
        assert data['description'] == self.game_item.description
        assert data['hidden'] is False

    def test_hidden_defaults_to_game_item_hidden_when_omitted(self, client):
        """Test that hidden defaults to the (non-hidden) GameItem's own hidden value."""
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is False

    def test_hidden_respects_submitted_value(self, client):
        """Test that an explicit hidden value overrides the GameItem's own default."""
        response = self._post(
            client, {'game_item_id': self.game_item.id, 'hidden': True},
            token=self._editor_token(),
        )
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_already_owned_returns_400(self, client):
        """Test that acquiring an already-owned game item returns 400."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        response = self._post(
            client, {'game_item_id': self.game_item.id}, token=self._editor_token(),
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'game_item_id' in data['errors']

    def test_hidden_game_item_returns_404_via_public_endpoint(self, client):
        """Test that acquiring a hidden game item via the public endpoint 404s, even for the DM."""
        hidden_item = GameItemFactory(game=self.game, name='Secret Ring', hidden=True)
        response = self._post(client, {'game_item_id': hidden_item.id}, token=self.dm_token)
        assert response.status_code == 404

    def test_game_item_not_in_game_returns_404(self, client):
        """Test that a game item not available in this game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_item = GameItemFactory(game=other_game, name='Orb')
        response = self._post(
            client, {'game_item_id': other_item.id}, token=self._editor_token(),
        )
        assert response.status_code == 404

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
            'game-pc-item-acquire',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_item_id': self.game_item.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self._editor_token().key}',
        )
        assert response.status_code == 201

    def test_dm_can_acquire_item(self, client):
        """Test that a DM of the game can acquire an item on behalf of a PC."""
        response = self._post(client, {'game_item_id': self.game_item.id}, token=self.dm_token)
        assert response.status_code == 201

    def test_staff_can_acquire_item(self, client):
        """Test that a global Staff user, neither owner nor DM, can acquire an item for a PC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(client, {'game_item_id': self.game_item.id}, token=staff_token)
        assert response.status_code == 201

    def test_unknown_game_item_id_returns_404(self, client):
        """Test that a non-existent game_item_id returns 404."""
        response = self._post(client, {'game_item_id': 99999}, token=self._editor_token())
        assert response.status_code == 404

    def test_missing_game_item_id_returns_400(self, client):
        """Test that a missing game_item_id returns 400."""
        response = self._post(client, {}, token=self._editor_token())
        assert response.status_code == 400
