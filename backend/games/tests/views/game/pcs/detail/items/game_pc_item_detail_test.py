"""Tests for the PC item detail view (GET detail / PATCH update)."""

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
class TestGamePcItemDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, item_id, character_id=None, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture character)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/items/{item_id}.json'

    def test_returns_id_game_item_id_name_description_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_item.id
        assert data['game_item_id'] == game_item.id
        assert data['name'] == 'Prized Gem'
        assert data['description'] == 'Very shiny.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing detail."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_character_item(self, client):
        """Test that a hidden character item is not visible on the public route."""
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item, hidden=True,
        )
        response = client.get(self._url(character_item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_item(self, client):
        """Test that 404 is returned for a non-existent item id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id, character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(character=other, game_item=game_item)
        response = client.get(self._url(character_item.id, character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        url = reverse(
            'game-pc-item-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'item_id': character_item.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGamePcItemDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/pcs/<id>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, an owning player/PC, an unrelated user, and a character item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.other_user = UserFactory(username='other', password='secret-password')
        game_item = GameItemFactory(
            game=self.game, name='Prized Gem', description='Very shiny.',
        )
        self.character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )

    def _url(self, item_id=None, character_id=None, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture)."""
        item_id = item_id if item_id is not None else self.character_item.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/items/{item_id}.json'

    def test_patch_without_token_returns_401(self, client):
        """Test that PATCH without a token is rejected with 401."""
        response = self.patch(client, self._url(), {'name': 'New Name'})
        assert response.status_code == 401

    def test_patch_with_unrelated_user_returns_403(self, client):
        """Test that PATCH from an unrelated user is rejected with 403."""
        token = Token.objects.create(user=self.other_user)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 403
        self.character_item.refresh_from_db()
        assert self.character_item.name is None

    def test_owner_can_patch(self, client):
        """Test that the PC's owning player can update the item and gets 200."""
        token = Token.objects.create(user=self.owner)
        response = self.patch(
            client, self._url(), {'name': 'Aragorns Gem'}, token=token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Aragorns Gem'
        self.character_item.refresh_from_db()
        assert self.character_item.name == 'Aragorns Gem'

    def test_dm_can_patch(self, client):
        """Test that the game's DM can update the item and gets 200."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(client, self._url(), {'hidden': True}, token=token)
        assert response.status_code == 200
        self.character_item.refresh_from_db()
        assert self.character_item.hidden is True

    def test_staff_can_patch(self, client):
        """Test that a global Staff account can update the item and gets 200."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'Staff Edit'}, token=token)
        assert response.status_code == 200

    def test_other_player_returns_403(self, client):
        """Test that another player in the game (not the owner) is rejected with 403."""
        other_player = PlayerFactory(game=self.game, name='Not Owner')
        other_owner = UserFactory(username='other_owner', password='secret-password')
        other_player.user = other_owner
        other_player.save()
        token = Token.objects.create(user=other_owner)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 403

    def test_patch_response_uses_detail_full_serializer(self, client):
        """Test that the PATCH response includes the hidden field (detail-full serializer)."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(client, self._url(), {'hidden': True}, token=token)
        data = json.loads(response.content)
        assert data['hidden'] is True

    def test_blank_name_persists_as_null_and_falls_back_to_game_item(self, client):
        """Test that a blank name is stored as null and the response falls back to GameItem."""
        token = Token.objects.create(user=self.owner)
        response = self.patch(client, self._url(), {'name': ''}, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Prized Gem'
        self.character_item.refresh_from_db()
        assert self.character_item.name is None

    def test_patch_partial_body_only_changes_given_fields(self, client):
        """Test that a partial PATCH body (only hidden) leaves name/description untouched."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(client, self._url(), {'hidden': True}, token=token)
        assert response.status_code == 200
        self.character_item.refresh_from_db()
        assert self.character_item.hidden is True
        assert self.character_item.name is None
        assert self.character_item.description is None

    def test_patch_returns_404_for_unknown_item(self, client):
        """Test that PATCH on a non-existent item id returns 404."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(
            client, self._url(item_id=99999), {'name': 'New Name'}, token=token,
        )
        assert response.status_code == 404
