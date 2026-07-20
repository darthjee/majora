"""Tests for the NPC item detail view."""

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
