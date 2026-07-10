"""Tests for the TreasureAccessSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from games.serializers import TreasureAccessSerializer
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
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


@pytest.mark.django_db
class TestTreasureAccessSerializer:
    """Tests for the TreasureAccessSerializer."""

    def setup_method(self):
        """Set up a treasure for testing."""
        self.treasure = TreasureFactory(name='Magic Ring', value=300)

    def test_superuser_can_edit(self):
        """Test that a superuser gets can_edit True."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is True

    def test_superuser_returns_full_context_fields(self):
        """Test that a superuser gets username, is_superuser, is_staff, is_dm, is_owner."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_staff'] is True
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_regular_user_cannot_edit(self):
        """Test that a regular user gets can_edit False."""
        user = UserFactory(username='player', password='secret-password')
        request = _make_request(user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False

    def test_regular_user_returns_full_context_fields(self):
        """Test that a regular user gets username, is_superuser, is_staff, is_dm, is_owner."""
        user = UserFactory(username='player', password='secret-password')
        request = _make_request(user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] == 'player'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user gets can_edit False."""
        request = _make_request(AnonymousUser())
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False

    def test_anonymous_user_returns_null_context_fields(self):
        """Test that an anonymous user gets null username/is_superuser/is_staff/is_dm."""
        request = _make_request(AnonymousUser())
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_staff'] is None
        assert data['is_dm'] is None
        assert data['is_owner'] is False

    def test_none_treasure_returns_can_edit_false(self):
        """Test that a None treasure instance returns can_edit False."""
        superuser = SuperUserFactory(username='admin2', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(None, context={'request': request}).data
        assert data['can_edit'] is False

    def test_dm_of_owning_game_can_edit(self):
        """Test that the DM of a treasure's owning game gets can_edit True."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is True
        assert data['is_dm'] is True
        assert data['is_owner'] is False

    def test_dm_of_other_game_cannot_edit_exclusive_treasure(self):
        """Test that a DM of a different game does not get can_edit True."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=other_game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False
        assert data['is_dm'] is False

    def test_non_dm_cannot_edit_global_treasure(self):
        """Test that can_edit stays False for a global treasure and a non-superuser DM."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=game, user=dm_user)
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False
