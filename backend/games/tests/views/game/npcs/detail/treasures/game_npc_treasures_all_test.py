"""Tests for the NPC treasures/all.json view (DM/superuser only, includes hidden)."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import CharacterTreasure
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    GameTreasureFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcTreasuresAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/npcs/<id>/treasures/all.json."""

    def setup_method(self):
        """Set up a game, a DM, an unrelated user, an NPC, and visible/hidden treasures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.other_user = UserFactory(username='other', password='secret-password')
        self.other_token = Token.objects.create(user=self.other_user)
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.visible_treasure = TreasureFactory(name='Visible Gem', value=100)
        self.hidden_treasure = TreasureFactory(name='Hidden Gem', value=200)
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.visible_treasure, quantity=1,
        )
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.hidden_treasure, quantity=1,
        )
        GameTreasureFactory(
            game=self.game, treasure=self.hidden_treasure, value=self.hidden_treasure.value,
            hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the treasures/all URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/treasures/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self.get(client, self._url())
        assert response.status_code == 401

    def test_returns_403_for_non_dm_authenticated_user(self, client):
        """Test that an authenticated user who is not a DM gets 403."""
        response = self.get(client, self._url(), token=self.other_token)
        assert response.status_code == 403

    def test_dm_gets_200_with_both_visible_and_hidden_treasures(self, client):
        """Test that a DM gets 200 with both visible and hidden held treasures."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_superuser_gets_200_with_both_visible_and_hidden_treasures(self, client):
        """Test that a superuser gets 200 with both visible and hidden held treasures."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_response_includes_hidden_field_per_item(self, client):
        """Test that each item carries its own hidden flag."""
        response = self.get(client, self._url(), token=self.dm_token)
        data = json.loads(response.content)
        by_name = {item['name']: item['hidden'] for item in data}
        assert by_name['Visible Gem'] is False
        assert by_name['Hidden Gem'] is True

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = self.get(client, self._url(character_id=99999), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = self.get(
            client, self._url(game_slug='unknown-game'), token=self.dm_token,
        )
        assert response.status_code == 404

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-treasures-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = self.get(client, url, token=self.dm_token)
        assert response.status_code == 200

    def test_filters_by_min_value(self, client):
        """Test that only treasures with value >= min_value are returned."""
        response = self.get(client, f'{self._url()}?min_value=150', token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Hidden Gem'

    def test_filters_by_max_value(self, client):
        """Test that only treasures with value <= max_value are returned."""
        response = self.get(client, f'{self._url()}?max_value=150', token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible Gem'

    def test_min_and_max_value_combined(self, client):
        """Test that min_value and max_value filters both apply together."""
        response = self.get(
            client, f'{self._url()}?min_value=50&max_value=250', token=self.dm_token,
        )
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert 'Visible Gem' in names
        assert 'Hidden Gem' in names

    def test_filters_by_name(self, client):
        """Test that only treasures whose name contains the name term are returned."""
        response = self.get(client, f'{self._url()}?name=Visible', token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible Gem'

    def test_name_filter_is_case_insensitive(self, client):
        """Test that the name filter matches regardless of case."""
        response = self.get(client, f'{self._url()}?name=visible gem', token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible Gem'
