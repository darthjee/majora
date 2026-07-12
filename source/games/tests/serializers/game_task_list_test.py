"""Tests for the GameTaskListSerializer."""

import pytest

from games.models import GameSession, Task
from games.serializers import GameTaskListSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestGameTaskListSerializer:
    """Tests for the GameTaskListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.task = Task.objects.create(game=self.game, short_description='Prep the ambush')

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
        """Test that only id, short_description, long_description, completed, session appear."""
        data = GameTaskListSerializer(self.task).data
        assert set(data.keys()) == {
            'id', 'short_description', 'long_description', 'completed', 'session',
        }
