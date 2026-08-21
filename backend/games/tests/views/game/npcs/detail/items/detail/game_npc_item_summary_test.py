"""Tests for the NPC item quantity summary endpoint (open to everyone, hidden-npc gated)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory, UserFactory


@pytest.mark.django_db
class TestGameNpcItemSummaryView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/items/<item_id>/npcs/<character_id>/summary.json."""

    def setup_method(self):
        """Set up a game, an NPC, and a game item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.game_item = GameItemFactory(game=self.game, name='Sting')
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)

    def _url(self, item_id=None, character_id=None, game_slug=None):
        """Return the summary endpoint URL (defaults to fixtures)."""
        item_id = item_id if item_id is not None else self.game_item.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/items/{item_id}/npcs/{character_id}/summary.json'

    def test_returns_zero_quantity_when_not_owned(self, client):
        """Test that quantity is 0 when the NPC owns none of the item."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == {'quantity': 0}

    def test_counts_multiple_owned_instances(self, client):
        """Test that quantity counts every CharacterItem row for the pair."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'quantity': 2}

    def test_excludes_hidden_character_item_rows(self, client):
        """Test that hidden CharacterItem rows are not counted in the regular variant."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        CharacterItem.objects.create(
            character=self.character, game_item=self.game_item, hidden=True,
        )
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'quantity': 1}

    def test_accessible_without_authentication(self, client):
        """Test that the endpoint is open to unauthenticated requests, for a non-hidden NPC."""
        response = self.get(client, self._url())
        assert response.status_code == 200

    def test_hidden_npc_returns_404_for_unrelated_user(self, client):
        """Test that a hidden NPC 404s for a user without edit permission."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(
            client, self._url(character_id=hidden_npc.id), token=self.other_token,
        )
        assert response.status_code == 404

    def test_hidden_npc_returns_404_for_unauthenticated(self, client):
        """Test that a hidden NPC 404s for an unauthenticated requester."""
        hidden_npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        response = self.get(client, self._url(character_id=hidden_npc.id))
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_item(self, client):
        """Test that 404 is returned for an item id not in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_item = GameItemFactory(game=other_game, name='Orb')
        response = self.get(client, self._url(item_id=other_item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.get(client, self._url(game_slug='no-such-game'))
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = self.get(client, self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-item-npc-summary',
            kwargs={
                'game_slug': self.game.game_slug,
                'item_id': self.game_item.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url)
        assert response.status_code == 200
