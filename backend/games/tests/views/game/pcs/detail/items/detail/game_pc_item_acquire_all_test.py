"""Tests for the DM-only PC item acquire-all endpoint (accepts hidden game items)."""

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
class TestGamePcItemAcquireAllView(TokenAuthRequestMixin):
    """Tests for POST /games/<slug>/pcs/<id>/items/acquire/all.json."""

    def setup_method(self):
        """Set up a game, a DM, a PC (with an owning player), and a hidden game item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player = PlayerFactory(name='Aragorn Player')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.owner_token = Token.objects.create(user=self.owner)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=self.player,
        )
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.hidden_item = GameItemFactory(game=self.game, name='Secret Ring', hidden=True)

    def _url(self, character_id=None, game_slug=None):
        """Return the acquire-all endpoint URL for the given character/game."""
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/pcs/{character_id}/items/acquire/all.json'

    def _post(self, client, token=None, character_id=None, game_slug=None):
        """Issue a POST request to the acquire-all endpoint, optionally with a token."""
        return self.post(
            client, self._url(character_id, game_slug),
            {'game_item_id': self.hidden_item.id}, token=token,
        )

    def test_dm_can_acquire_a_hidden_item_on_behalf_of_a_pc(self, client):
        """Test that a DM can acquire a hidden item on behalf of a PC via the all-variant."""
        response = self._post(client, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_superuser_can_acquire_a_hidden_item(self, client):
        """Test that a superuser can acquire a hidden item via the all-variant."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, token=token)
        assert response.status_code == 201

    def test_acquire_creates_character_item_row(self, client):
        """Test that acquiring a hidden item still creates the CharacterItem row."""
        self._post(client, token=self.dm_token)
        assert CharacterItem.objects.filter(
            character=self.character, game_item=self.hidden_item,
        ).exists()

    def test_owning_player_returns_403(self, client):
        """Test that even the PC's own owning player is rejected without GameEditPermission."""
        response = self._post(client, token=self.owner_token)
        assert response.status_code == 403

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client)
        assert response.status_code == 401

    def test_non_dm_authenticated_user_returns_403(self, client):
        """Test that an authenticated user who is not a DM/superuser gets 403."""
        response = self._post(client, token=self.other_token)
        assert response.status_code == 403

    def test_staff_returns_403(self, client):
        """Test that a global Staff user who is not the DM/superuser still gets 403."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        staff_token = Token.objects.create(user=staff_user)
        response = self._post(client, token=staff_token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game slug returns 404."""
        response = self._post(client, token=self.dm_token, game_slug='no-such-game')
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(client, token=self.dm_token, character_id=99999)
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self._post(client, token=self.dm_token, character_id=other.id)
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-item-acquire-all',
            kwargs={'game_slug': self.game.game_slug, 'character_id': self.character.id},
        )
        response = client.post(
            url,
            data=json.dumps({'game_item_id': self.hidden_item.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 201
