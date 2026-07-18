"""Tests for the NPC treasures view."""

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
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcTreasuresView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/npcs/<id>/treasures.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the treasures list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/npcs/{character_id}/treasures.json'

    def test_returns_empty_list_when_no_treasures(self, client):
        """Test that an empty list is returned when the character has no treasures."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_name_quantity_and_value_fields(self, client):
        """Test that list items include the correct name, quantity, and value fields."""
        treasure = TreasureFactory(name='Prized Gem', value=1000)
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=treasure, quantity=1,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_treasure.id
        assert data[0]['name'] == 'Prized Gem'
        assert data[0]['quantity'] == 1
        assert data[0]['value'] == 1000

    def test_value_reflects_the_game_treasure_row(self, client):
        """Test that value reflects the game's GameTreasure row, not the treasure's own value."""
        treasure = TreasureFactory(name='Discounted Gem', value=1000)
        self.game.treasures.add(treasure, through_defaults={'value': 100})
        CharacterTreasure.objects.create(character=self.character, treasure=treasure, quantity=1)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['value'] == 100

    def test_excludes_zero_quantity_treasures(self, client):
        """Test that a CharacterTreasure row with quantity 0 is excluded from the response."""
        treasure = TreasureFactory(name='Empty Pouch', value=10)
        CharacterTreasure.objects.create(character=self.character, treasure=treasure, quantity=0)
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=False)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(self._url())
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(f'{self._url()}?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            treasure = TreasureFactory(name=f'Gem {i}', value=10)
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(f'{self._url()}?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-treasures',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_returns_treasures_ordered_by_value_ascending(self, client):
        """Test that treasures are returned in ascending order of the treasure's own value."""
        expensive = TreasureFactory(name='Expensive Gem', value=300)
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        mid = TreasureFactory(name='Mid Gem', value=150)
        for treasure in (expensive, cheap, mid):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Cheap Gem', 'Mid Gem', 'Expensive Gem']

    def test_ties_in_value_break_by_treasure_id(self, client):
        """Test that treasures with equal value are ordered by treasure id ascending."""
        first = TreasureFactory(name='First Gem', value=100)
        second = TreasureFactory(name='Second Gem', value=100)
        for treasure in (first, second):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['First Gem', 'Second Gem']

    def test_orders_by_game_treasure_value_not_treasure_value(self, client):
        """Test that ordering uses GameTreasure.value even when Treasure.value disagrees."""
        first = TreasureFactory(name='First Gem', value=500)
        second = TreasureFactory(name='Second Gem', value=50)
        self.game.treasures.add(first, through_defaults={'value': 10})
        self.game.treasures.add(second, through_defaults={'value': 200})
        for treasure in (first, second):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['First Gem', 'Second Gem']

    def test_filters_by_name_substring(self, client):
        """Test that only treasures whose name contains the name term are returned."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        dagger = TreasureFactory(name='Silver Dagger', value=50)
        for treasure in (ring, dagger):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(f'{self._url()}?name=Ring')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_name_filter_is_case_insensitive(self, client):
        """Test that the name filter matches regardless of case."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        CharacterTreasure.objects.create(character=self.character, treasure=ring, quantity=1)
        response = client.get(f'{self._url()}?name=gold ring')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_name_filter_with_no_match_returns_empty_list(self, client):
        """Test that a name filter matching nothing returns an empty list."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        CharacterTreasure.objects.create(character=self.character, treasure=ring, quantity=1)
        response = client.get(f'{self._url()}?name=Nonexistent')
        data = json.loads(response.content)
        assert data == []

    def test_filters_by_min_value(self, client):
        """Test that only treasures with value >= min_value are returned."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        for treasure in (cheap, expensive):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(f'{self._url()}?min_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Expensive Gem'

    def test_filters_by_max_value(self, client):
        """Test that only treasures with value <= max_value are returned."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        for treasure in (cheap, expensive):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(f'{self._url()}?max_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Cheap Gem'

    def test_min_and_max_value_combined(self, client):
        """Test that min_value and max_value filters both apply together."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        mid = TreasureFactory(name='Mid Gem', value=150)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        for treasure in (cheap, mid, expensive):
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(f'{self._url()}?min_value=100&max_value=200')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Mid Gem'

    def test_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's response does not include X-Skip-Cache."""
        response = client.get(self._url())
        assert 'X-Skip-Cache' not in response

    def test_excludes_treasures_hidden_for_the_game(self, client):
        """Test that a held treasure whose GameTreasure row is hidden is excluded."""
        visible = TreasureFactory(name='Visible Gem', value=10)
        hidden = TreasureFactory(name='Hidden Gem', value=10)
        CharacterTreasure.objects.create(character=self.character, treasure=visible, quantity=1)
        CharacterTreasure.objects.create(character=self.character, treasure=hidden, quantity=1)
        GameTreasureFactory(game=self.game, treasure=hidden, value=hidden.value, hidden=True)
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [item['name'] for item in data]
        assert names == ['Visible Gem']

    def test_does_not_exclude_hidden_treasures_for_a_pc(self, client):
        """Test that a PC's own treasures list keeps showing hidden-for-the-game treasures."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        hidden = TreasureFactory(name='Hidden Gem', value=10)
        CharacterTreasure.objects.create(character=pc, treasure=hidden, quantity=1)
        GameTreasureFactory(game=self.game, treasure=hidden, value=hidden.value, hidden=True)
        response = client.get(f'/games/test-game/pcs/{pc.id}/treasures.json')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Hidden Gem']


@pytest.mark.django_db
class TestGameNpcTreasuresHidden(TokenAuthRequestMixin):
    """Tests for the hidden-NPC visibility gate in game_npc_treasures."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.hidden_npc = CharacterFactory(
            name='Secret NPC', game=self.game, npc=True, hidden=True
        )
        treasure = TreasureFactory(name='Hidden Gem', value=999)
        CharacterTreasure.objects.create(
            character=self.hidden_npc, treasure=treasure, quantity=1,
        )

    def _url(self, character=None):
        """Return the treasures list URL for the given character (defaults to the hidden NPC)."""
        character = character or self.hidden_npc
        return f'/games/test-game/npcs/{character.id}/treasures.json'

    def test_hidden_npc_treasures_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's treasures gets 404."""
        response = self.get(client, self._url())
        assert response.status_code == 404

    def test_hidden_npc_treasures_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's treasures."""
        other_user = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 404

    def test_hidden_npc_treasures_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's treasures."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_treasures_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's treasures."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_visible_npc_treasures_returns_200_for_anonymous(self, client):
        """Test that a visible NPC's treasures are still accessible to anonymous users."""
        visible_npc = CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        treasure = TreasureFactory(name='Public Gem', value=1)
        CharacterTreasure.objects.create(character=visible_npc, treasure=treasure, quantity=1)
        response = self.get(client, self._url(character=visible_npc))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_treasures_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's treasures includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_npc_treasures_404_response_includes_x_skip_cache_header(self, client):
        """Test that a 404 response for a hidden NPC's treasures includes X-Skip-Cache: true."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_visible_npc_treasures_response_does_not_include_x_skip_cache_header(self, client):
        """Test that a visible NPC's treasures response does not include X-Skip-Cache."""
        visible_npc = CharacterFactory(name='Visible NPC', game=self.game, npc=True, hidden=False)
        treasure = TreasureFactory(name='Public Gem', value=1)
        CharacterTreasure.objects.create(character=visible_npc, treasure=treasure, quantity=1)
        response = self.get(client, self._url(character=visible_npc))
        assert 'X-Skip-Cache' not in response
