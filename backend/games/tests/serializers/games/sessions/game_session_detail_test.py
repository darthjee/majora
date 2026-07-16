"""Tests for the GameSessionDetailSerializer."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from games.models import GameSession
from games.serializers import GameSessionDetailSerializer
from games.tests.factories import GameFactory


class TestGameSessionDetailSerializer(TestCase):
    """Tests for the GameSessionDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.factory = APIRequestFactory()

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

    def test_serializes_description_as_none_when_unset(self):
        """Test that description is null when the session has no description."""
        data = self._serialize()
        assert data['description'] is None

    def test_serializes_description_when_set(self):
        """Test that description is serialized when set."""
        self.session.description = 'Some session notes.'
        self.session.save()
        data = self._serialize()
        assert data['description'] == 'Some session notes.'

    def test_only_exposes_expected_fields(self):
        """Test that only id, title, date, description, and game_slug are exposed."""
        data = self._serialize()
        assert set(data.keys()) == {
            'id', 'title', 'date', 'description', 'game_slug',
        }
