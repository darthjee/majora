"""Tests for the TreasureAccessSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory

from games.models import Game, GameMaster, Treasure
from games.serializers import TreasureAccessSerializer


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
        self.treasure = Treasure.objects.create(name='Magic Ring', value=300)

    def test_superuser_can_edit(self):
        """Test that a superuser gets can_edit True."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is True

    def test_regular_user_cannot_edit(self):
        """Test that a regular user gets can_edit False."""
        user = User.objects.create_user(username='player', password='secret-password')
        request = _make_request(user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user gets can_edit False."""
        request = _make_request(AnonymousUser())
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False

    def test_none_treasure_returns_can_edit_false(self):
        """Test that a None treasure instance returns can_edit False."""
        superuser = User.objects.create_superuser(username='admin2', password='secret-password')
        request = _make_request(superuser)
        data = TreasureAccessSerializer(None, context={'request': request}).data
        assert data['can_edit'] is False

    def test_dm_of_owning_game_can_edit(self):
        """Test that the DM of a treasure's owning game gets can_edit True."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is True

    def test_dm_of_other_game_cannot_edit_exclusive_treasure(self):
        """Test that a DM of a different game does not get can_edit True."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=other_game, user=dm_user)
        self.treasure.game = game
        self.treasure.save()
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False

    def test_non_dm_cannot_edit_global_treasure(self):
        """Test that can_edit stays False for a global treasure and a non-superuser DM."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=game, user=dm_user)
        request = _make_request(dm_user)
        data = TreasureAccessSerializer(self.treasure, context={'request': request}).data
        assert data['can_edit'] is False
