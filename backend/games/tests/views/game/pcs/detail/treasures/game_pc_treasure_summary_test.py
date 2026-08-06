"""Tests for the PC treasure quantity summary endpoint (open to everyone)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameTreasureFactory,
    PlayerFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcTreasureSummaryView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/treasures/<treasure_id>/pcs/<character_id>/summary.json."""

    def setup_method(self):
        """Set up a game, a PC, and a treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.treasure = TreasureFactory(name='Potion of Healing', value=100, game=self.game)

    def _url(self, treasure_id=None, character_id=None, game_slug=None):
        """Return the summary endpoint URL (defaults to fixtures)."""
        treasure_id = treasure_id if treasure_id is not None else self.treasure.id
        character_id = character_id if character_id is not None else self.character.id
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        return f'/games/{game_slug}/treasures/{treasure_id}/pcs/{character_id}/summary.json'

    def test_returns_zero_quantity_when_not_owned(self, client):
        """Test that quantity is 0 when the PC owns none of the treasure."""
        response = self.get(client, self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == {'quantity': 0}

    def test_returns_the_owned_quantity(self, client):
        """Test that quantity reflects the CharacterTreasure row's quantity field."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=5,
        )
        response = self.get(client, self._url())
        assert json.loads(response.content) == {'quantity': 5}

    def test_accessible_without_authentication(self, client):
        """Test that the endpoint is open to unauthenticated requests."""
        response = self.get(client, self._url())
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_treasure(self, client):
        """Test that 404 is returned for a treasure not available in this game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_treasure = TreasureFactory(name='Orb', value=10, game=other_game)
        response = self.get(client, self._url(treasure_id=other_treasure.id))
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
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = self.get(client, self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-treasure-pc-summary',
            kwargs={
                'game_slug': self.game.game_slug,
                'treasure_id': self.treasure.id,
                'character_id': self.character.id,
            },
        )
        response = self.get(client, url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestGamePcTreasureSummaryHiddenTreasure(TokenAuthRequestMixin):
    """Tests for the summary endpoint against a treasure hidden (GameTreasure.hidden) in game."""

    def setup_method(self):
        """Set up a game, a DM, an owning PC, and a hidden treasure."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.treasure = TreasureFactory(name='Secret Gem', value=100, game=self.game)
        GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )

    def _url(self):
        """Return the summary endpoint URL for the hidden treasure fixtures."""
        return (
            f'/games/{self.game.game_slug}/treasures/{self.treasure.id}/'
            f'pcs/{self.character.id}/summary.json'
        )

    def test_dm_gets_404_for_a_hidden_treasure(self, client):
        """Test that the regular summary endpoint 404s on a hidden treasure, even for the DM."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 404
