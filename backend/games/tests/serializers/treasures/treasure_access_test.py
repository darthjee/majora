"""Tests for the TreasureAccessSerializer."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.serializers import TreasureAccessSerializer
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


def _make_request(user):
    """Build a request with the given user attached."""
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user
    return request


class TestTreasureAccessSerializer(TestCase):
    """Tests for the TreasureAccessSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a treasure for testing."""
        cls.treasure = TreasureFactory(name='Magic Ring', value=300)

    def test_response_does_not_include_can_edit(self):
        """Test that the serialized data never includes can_edit (moved to permissions)."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert 'can_edit' not in data

    def test_superuser_returns_full_context_fields(self):
        """Test that a superuser gets username, is_superuser, is_staff, is_dm, is_owner."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_staff'] is True
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_regular_user_returns_full_context_fields(self):
        """Test that a regular user gets username, is_superuser, is_staff, is_dm, is_owner."""
        user = UserFactory(username='player', password='secret-password')
        request = _make_request(user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] == 'player'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_anonymous_user_returns_null_context_fields(self):
        """Test that an anonymous user gets null username/is_superuser/is_staff/is_dm."""
        request = _make_request(AnonymousUser())
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_staff'] is None
        assert data['is_dm'] is None
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_dm_of_owning_game_returns_is_dm_true(self):
        """Test that the DM of a treasure's owning game gets is_dm True."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['is_dm'] is True
        assert data['is_owner'] is False

    def test_dm_of_other_game_returns_is_dm_false(self):
        """Test that a DM of a different game does not get is_dm True."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=other_game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['is_dm'] is False

    def test_player_of_owning_game_returns_is_player_false(self):
        """Test that is_player stays False for a player of the treasure's owning game."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=game)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(player_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['is_player'] is False

    def test_anonymous_returns_is_player_false(self):
        """Test that is_player stays False (never null) for an anonymous caller."""
        request = _make_request(AnonymousUser())
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['is_player'] is False
