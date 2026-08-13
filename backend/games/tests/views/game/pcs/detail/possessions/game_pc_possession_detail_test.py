"""Tests for the PC possession detail view (GET only)."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterPossession
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameFactory, GamePossessionFactory


@pytest.mark.django_db
class TestGamePcPossessionDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/possessions/<possession_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, possession_id, character_id=None, game_slug='test-game'):
        """Return the possession detail URL (defaults to the fixture character)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/possessions/{possession_id}.json'

    def test_returns_id_game_possession_id_name_description_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_possession = GamePossessionFactory(
            game=self.game, name='Bag End', description='A comfortable hobbit-hole.',
        )
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_possession.id
        assert data['game_possession_id'] == game_possession.id
        assert data['name'] == 'Bag End'
        assert data['description'] == 'A comfortable hobbit-hole.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing detail."""
        game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_character_possession(self, client):
        """Test that a hidden character possession is not visible on the public route."""
        game_possession = GamePossessionFactory(game=self.game, name='Hidden Vault')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession, hidden=True,
        )
        response = client.get(self._url(character_possession.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_possession(self, client):
        """Test that 404 is returned for a non-existent possession id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id, character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        character_possession = CharacterPossession.objects.create(
            character=other, game_possession=game_possession,
        )
        response = client.get(self._url(character_possession.id, character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_possession = GamePossessionFactory(game=self.game, name='Bag End')
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=game_possession,
        )
        url = reverse(
            'game-pc-possession-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'possession_id': character_possession.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200
