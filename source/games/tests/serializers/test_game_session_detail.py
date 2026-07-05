"""Tests for the GameSessionDetailSerializer."""

import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory

from games.models import Game, GameMaster, GameSession
from games.serializers import GameSessionDetailSerializer


@pytest.mark.django_db
class TestGameSessionDetailSerializer:
    """Tests for the GameSessionDetailSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.session = GameSession.objects.create(game=self.game, title='Session One')
        self.factory = APIRequestFactory()

    def _serialize(self, user=None):
        """Build a request with the given user and serialize the session."""
        request = self.factory.get('/')
        request.user = user if user is not None else AnonymousUser()
        return GameSessionDetailSerializer(self.session, context={'request': request}).data

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = self._serialize()
        assert data['id'] == self.session.id

    def test_serializes_title(self):
        """Test that the title field is serialized."""
        data = self._serialize()
        assert data['title'] == 'Session One'

    def test_serializes_date_as_none_when_unset(self):
        """Test that date is null when the session has no date."""
        data = self._serialize()
        assert data['date'] is None

    def test_serializes_date_when_set(self):
        """Test that date is serialized when set."""
        self.session.date = '2026-01-01'
        self.session.save()
        data = self._serialize()
        assert data['date'] == '2026-01-01'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is sourced from the related game."""
        data = self._serialize()
        assert data['game_slug'] == 'test-game'

    def test_only_exposes_expected_fields(self):
        """Test that only id, title, date, game_slug, and can_edit are exposed."""
        data = self._serialize()
        assert set(data.keys()) == {'id', 'title', 'date', 'game_slug', 'can_edit'}

    def test_can_edit_is_false_for_anonymous_user(self):
        """Test that can_edit is false for an anonymous user."""
        data = self._serialize(AnonymousUser())
        assert data['can_edit'] is False

    def test_can_edit_is_true_for_superuser(self):
        """Test that can_edit is true for a superuser."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        data = self._serialize(superuser)
        assert data['can_edit'] is True

    def test_can_edit_is_true_for_game_master(self):
        """Test that can_edit is true for a DM of the session's game."""
        dm_user = User.objects.create_user(username='dm', password='secret-password')
        GameMaster.objects.create(game=self.game, user=dm_user)
        data = self._serialize(dm_user)
        assert data['can_edit'] is True

    def test_can_edit_is_false_for_unrelated_user(self):
        """Test that can_edit is false for an unrelated authenticated user."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        data = self._serialize(other_user)
        assert data['can_edit'] is False

    def test_can_edit_is_false_without_request_context(self):
        """Test that can_edit is false when no request is present in the context."""
        data = GameSessionDetailSerializer(self.session, context={}).data
        assert data['can_edit'] is False
