"""Tests for the NPC item detail view (GET detail / PATCH update / hidden-NPC gate)."""

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
class TestGameNpcItemDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, item_id, character_id=None, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture character)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/items/{item_id}.json'

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

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
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
            'game-npc-item-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'item_id': character_item.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        game_item = GameItemFactory(game=self.game, name='Gem')
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=game_item,
        )
        response = client.get(self._url(character_item.id))
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGameNpcItemDetailHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_item_detail."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        self.character_item = CharacterItem.objects.create(
            character=self.hidden_npc, game_item=game_item,
        )

    def _url(self, character=None):
        """Return the item detail URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/items/{self.character_item.id}.json'

    def test_hidden_npc_item_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's item gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_item_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's item."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_item_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's item."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_hidden_npc_item_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200

    def test_hidden_npc_item_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's item includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_item_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's item includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameNpcItemDetailPatchView(TokenAuthRequestMixin):
    """Tests for the PATCH /games/<slug>/npcs/<id>/items/<item_id>.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a visible NPC, an unrelated user, and a character item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
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
        return f'/games/{game_slug}/npcs/{character_id}/items/{item_id}.json'

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

    def test_dm_can_patch(self, client):
        """Test that the game's DM can update the item and gets 200."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(client, self._url(), {'hidden': True}, token=token)
        assert response.status_code == 200
        self.character_item.refresh_from_db()
        assert self.character_item.hidden is True

    def test_superuser_can_patch(self, client):
        """Test that a superuser can update the item and gets 200."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 200

    def test_staff_can_patch_visible_npc(self, client):
        """Test that a global Staff account can update an item on a visible NPC."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'Staff Edit'}, token=token)
        assert response.status_code == 200

    def test_blank_name_persists_as_null_and_falls_back_to_game_item(self, client):
        """Test that a blank name is stored as null and the response falls back to GameItem."""
        token = Token.objects.create(user=self.dm_user)
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


@pytest.mark.django_db
class TestGameNpcItemDetailPatchHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate on PATCH item-detail for an NPC."""

    def setup_method(self):
        """Set up a game, a DM, a hidden NPC, and a character item held by it."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True,
        )
        game_item = GameItemFactory(game=self.game, name='Hidden Gem')
        self.character_item = CharacterItem.objects.create(
            character=self.hidden_npc, game_item=game_item,
        )

    def _url(self):
        """Return the item detail URL for the hidden NPC's item."""
        return f'/games/test-game/npcs/{self.hidden_npc.id}/items/{self.character_item.id}.json'

    def test_staff_gets_404_for_hidden_npc(self, client):
        """Test that a global Staff account gets 404, despite otherwise being able to edit."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 404
        self.character_item.refresh_from_db()
        assert self.character_item.name is None

    def test_regular_user_gets_404_for_hidden_npc(self, client):
        """Test that a regular authenticated user gets 404 for a hidden NPC's item."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 404

    def test_dm_can_still_patch_hidden_npc(self, client):
        """Test that a DM can still PATCH an item held by a hidden NPC."""
        token = Token.objects.create(user=self.dm_user)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 200
        self.character_item.refresh_from_db()
        assert self.character_item.name == 'New Name'

    def test_superuser_can_still_patch_hidden_npc(self, client):
        """Test that a superuser can still PATCH an item held by a hidden NPC."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.patch(client, self._url(), {'name': 'New Name'}, token=token)
        assert response.status_code == 200
