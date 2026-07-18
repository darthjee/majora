"""Tests for the game treasures view."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameTreasure, Treasure
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    GameTreasureFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


class TestGameTreasuresView(TestCase):
    """Tests for the GET /games/<slug>/treasures.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_treasures(self):
        """Test that an empty list is returned when the game has no treasures."""
        response = self.client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_treasures(self):
        """Test that only treasures linked to the game are returned."""
        treasure = TreasureFactory(name='Gold Ring', value=100)
        other_treasure = TreasureFactory(name='Silver Dagger', value=50)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        self.other_game.treasures.add(
            other_treasure, through_defaults={'value': other_treasure.value},
        )
        response = self.client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_returns_id_name_value_fields(self):
        """Test that list items include id, name, and value fields."""
        treasure = TreasureFactory(name='Enchanted Bow', value=750)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['id'] == treasure.id
        assert data[0]['name'] == 'Enchanted Bow'
        assert data[0]['value'] == 750

    def test_filters_by_max_value(self):
        """Test that only treasures with value <= max_value are returned."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get('/games/test-game/treasures.json?max_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Cheap Gem'

    def test_filters_by_max_value_using_game_treasure_value_not_treasure_value(self):
        """Test that max_value filters on GameTreasure.value even when Treasure.value differs."""
        treasure = TreasureFactory(name='Discounted Gem', value=500)
        self.game.treasures.add(treasure, through_defaults={'value': 50})
        response = self.client.get('/games/test-game/treasures.json?max_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Discounted Gem'

    def test_filters_out_by_max_value_using_game_treasure_value_not_treasure_value(self):
        """Test that max_value excludes a treasure whose GameTreasure.value exceeds it."""
        treasure = TreasureFactory(name='Marked Up Gem', value=50)
        self.game.treasures.add(treasure, through_defaults={'value': 500})
        response = self.client.get('/games/test-game/treasures.json?max_value=100')
        data = json.loads(response.content)
        assert data == []

    def test_returns_all_treasures_when_max_value_absent(self):
        """Test that all treasures are returned when max_value is not provided."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 2

    def test_ignores_non_numeric_max_value(self):
        """Test that a non-numeric max_value is ignored rather than erroring."""
        treasure = TreasureFactory(name='Gem', value=50)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json?max_value=not-a-number')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/treasures.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/treasures.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/treasures.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            treasure = TreasureFactory(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            treasure = TreasureFactory(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-treasures', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_does_not_return_unlinked_treasures(self):
        """Test that treasures not linked to the game are excluded."""
        TreasureFactory(name='Orphan Treasure', value=300)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []

    def test_returns_game_exclusive_treasures(self):
        """Test that treasures owned exclusively by the game (FK) are returned."""
        treasure = TreasureFactory(name='Exclusive Gem', value=400, game=self.game)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == treasure.id
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_union_of_linked_and_exclusive_treasures(self):
        """Test that both M2M-linked and FK-owned treasures are returned, without duplicates."""
        linked = TreasureFactory(name='Linked Gem', value=100)
        self.game.treasures.add(linked, through_defaults={'value': linked.value})
        exclusive = TreasureFactory(name='Exclusive Gem', value=200, game=self.game)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        names = {item['name'] for item in data}
        assert names == {'Linked Gem', 'Exclusive Gem'}
        assert len(data) == 2
        assert exclusive.id in {item['id'] for item in data}

    def test_does_not_return_other_games_exclusive_treasures(self):
        """Test that a treasure exclusive to another game is excluded."""
        TreasureFactory(name='Other Gem', value=300, game=self.other_game)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []

    def test_excludes_hidden_linked_treasures(self):
        """Test that a hidden treasure linked to the game via M2M is excluded."""
        hidden = TreasureFactory(name='Hidden Gem', value=100)
        self.game.treasures.add(hidden, through_defaults={'value': hidden.value})
        GameTreasure.objects.filter(game=self.game, treasure=hidden).update(hidden=True)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []

    def test_excludes_hidden_exclusive_treasures(self):
        """Test that a hidden treasure exclusive to the game is excluded."""
        treasure = TreasureFactory(name='Hidden Exclusive Gem', value=100, game=self.game)
        GameTreasureFactory(game=self.game, treasure=treasure, value=treasure.value, hidden=True)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []

    def test_includes_visible_treasures_alongside_hidden_ones(self):
        """Test that non-hidden treasures are still returned when hidden ones exist too."""
        visible = TreasureFactory(name='Visible Gem', value=100, game=self.game)
        hidden = TreasureFactory(name='Hidden Gem', value=100, game=self.game)
        GameTreasureFactory(game=self.game, treasure=hidden, value=hidden.value, hidden=True)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == visible.id

    def test_available_units_and_max_units_are_none_when_unlimited(self):
        """Test that available_units/max_units are None for a treasure without a stock cap."""
        treasure = TreasureFactory(name='Unlimited Gem', value=100)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['available_units'] is None
        assert data[0]['max_units'] is None

    def test_available_units_and_max_units_reflect_the_game_treasure_row(self):
        """Test that available_units/max_units reflect the linked GameTreasure row's cap."""
        treasure = TreasureFactory(name='Limited Gem', value=100)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        GameTreasure.objects.filter(game=self.game, treasure=treasure).update(
            max_units=10, acquired_units=3,
        )
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['max_units'] == 10
        assert data[0]['available_units'] == 7

    def test_available_units_and_max_units_are_none_for_exclusive_treasure(self):
        """Test that available_units/max_units are None for a treasure exclusive to the game."""
        TreasureFactory(name='Exclusive Gem', value=100, game=self.game)
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['available_units'] is None
        assert data[0]['max_units'] is None

    def test_returns_treasures_ordered_by_value_ascending(self):
        """Test that treasures are returned in ascending order of value."""
        expensive = TreasureFactory(name='Expensive Gem', value=300)
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        mid = TreasureFactory(name='Mid Gem', value=150)
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(mid, through_defaults={'value': mid.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Cheap Gem', 'Mid Gem', 'Expensive Gem']

    def test_ties_in_value_break_by_id(self):
        """Test that treasures with equal value are ordered by id ascending."""
        first = TreasureFactory(name='First Gem', value=100)
        second = TreasureFactory(name='Second Gem', value=100)
        self.game.treasures.add(first, through_defaults={'value': first.value})
        self.game.treasures.add(second, through_defaults={'value': second.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]

    def test_orders_by_game_treasure_value_not_treasure_value(self):
        """Test that ordering uses GameTreasure.value even when Treasure.value disagrees."""
        first = TreasureFactory(name='First Gem', value=500)
        second = TreasureFactory(name='Second Gem', value=50)
        self.game.treasures.add(first, through_defaults={'value': 10})
        self.game.treasures.add(second, through_defaults={'value': 200})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['First Gem', 'Second Gem']

    def test_filters_by_name_substring(self):
        """Test that only treasures whose name contains the name term are returned."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        dagger = TreasureFactory(name='Silver Dagger', value=50)
        self.game.treasures.add(ring, through_defaults={'value': ring.value})
        self.game.treasures.add(dagger, through_defaults={'value': dagger.value})
        response = self.client.get('/games/test-game/treasures.json?name=Ring')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_name_filter_is_case_insensitive(self):
        """Test that the name filter matches regardless of case."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        self.game.treasures.add(ring, through_defaults={'value': ring.value})
        response = self.client.get('/games/test-game/treasures.json?name=gold ring')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_name_filter_with_no_match_returns_empty_list(self):
        """Test that a name filter matching nothing returns an empty list."""
        ring = TreasureFactory(name='Gold Ring', value=100)
        self.game.treasures.add(ring, through_defaults={'value': ring.value})
        response = self.client.get('/games/test-game/treasures.json?name=Nonexistent')
        data = json.loads(response.content)
        assert data == []

    def test_name_filter_combined_with_max_value(self):
        """Test that name and max_value filters both apply together."""
        cheap_ring = TreasureFactory(name='Cheap Ring', value=50)
        expensive_ring = TreasureFactory(name='Expensive Ring', value=500)
        dagger = TreasureFactory(name='Cheap Dagger', value=50)
        self.game.treasures.add(cheap_ring, through_defaults={'value': cheap_ring.value})
        self.game.treasures.add(expensive_ring, through_defaults={'value': expensive_ring.value})
        self.game.treasures.add(dagger, through_defaults={'value': dagger.value})
        response = self.client.get('/games/test-game/treasures.json?name=Ring&max_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Cheap Ring'

    def test_filters_by_min_value(self):
        """Test that only treasures with value >= min_value are returned."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get('/games/test-game/treasures.json?min_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Expensive Gem'

    def test_filters_by_min_value_using_game_treasure_value_not_treasure_value(self):
        """Test that min_value filters on GameTreasure.value even when Treasure.value differs."""
        treasure = TreasureFactory(name='Marked Up Gem', value=50)
        self.game.treasures.add(treasure, through_defaults={'value': 500})
        response = self.client.get('/games/test-game/treasures.json?min_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Marked Up Gem'

    def test_ignores_non_numeric_min_value(self):
        """Test that a non-numeric min_value is ignored rather than erroring."""
        treasure = TreasureFactory(name='Gem', value=50)
        self.game.treasures.add(treasure, through_defaults={'value': treasure.value})
        response = self.client.get('/games/test-game/treasures.json?min_value=not-a-number')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_min_value_combined_with_max_value(self):
        """Test that min_value and max_value filters both apply together."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        mid = TreasureFactory(name='Mid Gem', value=150)
        expensive = TreasureFactory(name='Expensive Gem', value=500)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(mid, through_defaults={'value': mid.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get(
            '/games/test-game/treasures.json?min_value=100&max_value=200'
        )
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Mid Gem'

    def test_ordering_desc_reverses_order_by_value(self):
        """Test that ordering=desc returns treasures in descending order of value."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=300)
        mid = TreasureFactory(name='Mid Gem', value=150)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        self.game.treasures.add(mid, through_defaults={'value': mid.value})
        response = self.client.get('/games/test-game/treasures.json?ordering=desc')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Expensive Gem', 'Mid Gem', 'Cheap Gem']

    def test_ordering_invalid_value_falls_back_to_ascending(self):
        """Test that an invalid ordering value falls back to the ascending default."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=300)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get('/games/test-game/treasures.json?ordering=bogus')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Cheap Gem', 'Expensive Gem']

    def test_exclusive_treasure_filters_and_displays_by_game_treasure_value(self):
        """Test that an exclusive treasure's filter/display reflects its GameTreasure.value."""
        treasure = TreasureFactory(name='Exclusive Gem', value=500, game=self.game)
        GameTreasure.objects.create(game=self.game, treasure=treasure, value=50)
        response = self.client.get('/games/test-game/treasures.json?max_value=100')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Exclusive Gem'
        assert data[0]['value'] == 50

    def test_ordering_absent_defaults_to_ascending(self):
        """Test that omitting ordering still returns today's ascending order."""
        cheap = TreasureFactory(name='Cheap Gem', value=50)
        expensive = TreasureFactory(name='Expensive Gem', value=300)
        self.game.treasures.add(cheap, through_defaults={'value': cheap.value})
        self.game.treasures.add(expensive, through_defaults={'value': expensive.value})
        response = self.client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Cheap Gem', 'Expensive Gem']


class TestGameTreasuresCreate(TestCase):
    """Tests for the POST /games/<slug>/treasures.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a superuser, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(
            username='admin', password='secret-password'
        )
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(
            username='player', password='secret-password'
        )
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game treasures list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/treasures.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_treasure(self):
        """Test that a DM of the game can create a treasure and receives 201."""
        response = self._post(self.client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_treasure(self):
        """Test that a superuser can create a treasure and receives 201."""
        response = self._post(
            self.client, {'name': 'Gem', 'value': 100}, token=self.superuser_token
        )
        assert response.status_code == 201

    def test_created_treasure_is_linked_to_game_via_fk(self):
        """Test that the created treasure's game FK is set to the resolved game."""
        self._post(self.client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        treasure = Treasure.objects.get(name='Gem')
        assert treasure.game == self.game

    def test_create_also_creates_the_game_treasure_row(self):
        """Test that a GameTreasure row is created with the posted value."""
        self._post(self.client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        treasure = Treasure.objects.get(name='Gem')
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.value == 100

    def test_create_returns_treasure_detail(self):
        """Test that the response body contains id, name, value, and game_slug."""
        response = self._post(self.client, {'name': 'Gem', 'value': 100}, token=self.dm_token)
        data = json.loads(response.content)
        assert data['name'] == 'Gem'
        assert data['value'] == 100
        assert data['game_slug'] == 'test-game'
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self.client, {'name': 'Gem', 'value': 100})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(self.client, {'name': 'Gem', 'value': 100}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self):
        """Test that a POST without name returns 400."""
        response = self._post(self.client, {'value': 100}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_value_returns_400(self):
        """Test that a POST without value returns 400."""
        response = self._post(self.client, {'name': 'Gem'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'value' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            self.client,
            {'name': 'Gem', 'value': 100},
            token=self.dm_token,
            game_slug='unknown-game',
        )
        assert response.status_code == 404

    def test_created_treasure_can_be_marked_hidden(self):
        """Test that a treasure's GameTreasure row is marked hidden via the POST payload."""
        self._post(
            self.client, {'name': 'Secret Gem', 'value': 100, 'hidden': True}, token=self.dm_token
        )
        treasure = Treasure.objects.get(name='Secret Gem')
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.hidden is True

    def test_created_treasure_defaults_to_not_hidden(self):
        """Test that a treasure's GameTreasure row defaults to not hidden when omitted."""
        self._post(self.client, {'name': 'Open Gem', 'value': 100}, token=self.dm_token)
        treasure = Treasure.objects.get(name='Open Gem')
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=treasure)
        assert game_treasure.hidden is False

    def test_malformed_hidden_returns_400(self):
        """Test that a non-boolean hidden value is rejected with 400 rather than coerced."""
        response = self._post(
            self.client,
            {'name': 'Ambiguous Gem', 'value': 100, 'hidden': 'maybe'},
            token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'hidden' in data['errors']
        assert not Treasure.objects.filter(name='Ambiguous Gem').exists()

    def test_game_field_in_body_is_ignored(self):
        """Test that a game value in the request body does not override the resolved game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        response = self._post(
            self.client, {'name': 'Gem', 'value': 100, 'game': other_game.id}, token=self.dm_token
        )
        assert response.status_code == 201
        treasure = Treasure.objects.get(name='Gem')
        assert treasure.game == self.game

    def test_created_treasure_defaults_to_the_owning_games_type(self):
        """Test that a treasure created in a deadlands game gets the game's type."""
        deadlands_game = GameFactory(
            name='Deadlands Game', game_slug='deadlands-game', game_type='deadlands',
        )
        GameMasterFactory(game=deadlands_game, user=self.dm_user)
        self._post(
            self.client, {'name': 'Bag of Cents', 'value': 100}, token=self.dm_token,
            game_slug='deadlands-game',
        )
        treasure = Treasure.objects.get(name='Bag of Cents')
        assert treasure.game_type == 'deadlands'

    def test_created_treasure_game_type_overrides_client_provided_value(self):
        """Test that a client-provided game_type is ignored in favor of the game's own type."""
        deadlands_game = GameFactory(
            name='Deadlands Game 2', game_slug='deadlands-game-2', game_type='deadlands',
        )
        GameMasterFactory(game=deadlands_game, user=self.dm_user)
        self._post(
            self.client, {'name': 'Sneaky Gem', 'value': 100, 'game_type': 'dnd'},
            token=self.dm_token, game_slug='deadlands-game-2',
        )
        treasure = Treasure.objects.get(name='Sneaky Gem')
        assert treasure.game_type == 'deadlands'
