"""Tests for the GameTaskListSerializer."""

from django.test import TestCase

from games.models import GameSession, Task
from games.serializers import GameTaskListSerializer
from games.tests.factories import GameFactory


class TestGameTaskListSerializer(TestCase):
    """Tests for the GameTaskListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.task = Task.objects.create(game=cls.game, short_description='Prep the ambush')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameTaskListSerializer(self.task).data
        assert data['id'] == self.task.id

    def test_serializes_short_description(self):
        """Test that the short_description field is serialized."""
        data = GameTaskListSerializer(self.task).data
        assert data['short_description'] == 'Prep the ambush'

    def test_serializes_long_description(self):
        """Test that the long_description field is serialized."""
        self.task.long_description = 'Line one\nLine two'
        self.task.save()
        data = GameTaskListSerializer(self.task).data
        assert data['long_description'] == 'Line one\nLine two'

    def test_serializes_completed(self):
        """Test that the completed field is serialized."""
        data = GameTaskListSerializer(self.task).data
        assert data['completed'] is False

    def test_serializes_category_default(self):
        """Test that the category field is serialized with its default value."""
        data = GameTaskListSerializer(self.task).data
        assert data['category'] == 'other'

    def test_serializes_category_when_set(self):
        """Test that a set category is serialized."""
        self.task.category = Task.CATEGORY_PAINTING
        self.task.save()
        data = GameTaskListSerializer(self.task).data
        assert data['category'] == 'painting'

    def test_serializes_session_as_none_when_unset(self):
        """Test that session is null when the task has no session."""
        data = GameTaskListSerializer(self.task).data
        assert data['session'] is None

    def test_serializes_session_id_when_set(self):
        """Test that session is serialized as the linked session's id."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        self.task.session = session
        self.task.save()
        data = GameTaskListSerializer(self.task).data
        assert data['session'] == session.id

    def test_only_exposes_expected_fields(self):
        """Test that only the task fields (including category) appear."""
        data = GameTaskListSerializer(self.task).data
        assert set(data.keys()) == {
            'id', 'short_description', 'long_description', 'completed', 'session', 'category',
        }
