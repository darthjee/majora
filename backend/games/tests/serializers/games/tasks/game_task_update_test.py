"""Tests for the GameTaskUpdateSerializer."""

from django.test import TestCase

from games.models import GameSession, Task
from games.serializers import GameTaskUpdateSerializer
from games.tests.factories import GameFactory


class TestGameTaskUpdateSerializer(TestCase):
    """Tests for GameTaskUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a task instance for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.task = Task.objects.create(game=cls.game, short_description='Prep the ambush')

    def test_valid_partial_short_description_update(self):
        """Test that a partial update with only short_description is valid."""
        serializer = GameTaskUpdateSerializer(
            self.task,
            data={'short_description': 'Prep the escape'},
            partial=True,
            context={'game': self.game},
        )
        assert serializer.is_valid()
        task = serializer.save()
        assert task.short_description == 'Prep the escape'

    def test_valid_partial_completed_update(self):
        """Test that a partial update with only completed is valid."""
        serializer = GameTaskUpdateSerializer(
            self.task, data={'completed': True}, partial=True, context={'game': self.game},
        )
        assert serializer.is_valid()
        task = serializer.save()
        assert task.completed is True

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameTaskUpdateSerializer(
            self.task, data={}, partial=True, context={'game': self.game},
        )
        assert serializer.is_valid()

    def test_session_can_be_set(self):
        """Test that a session belonging to the same game may be set."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        serializer = GameTaskUpdateSerializer(
            self.task, data={'session': session.id}, partial=True, context={'game': self.game},
        )
        assert serializer.is_valid()
        task = serializer.save()
        assert task.session == session

    def test_session_can_be_cleared(self):
        """Test that session may be cleared by passing null."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        self.task.session = session
        self.task.save()
        serializer = GameTaskUpdateSerializer(
            self.task, data={'session': None}, partial=True, context={'game': self.game},
        )
        assert serializer.is_valid()
        task = serializer.save()
        assert task.session is None

    def test_invalid_when_session_belongs_to_different_game(self):
        """Test that a session belonging to a different game is rejected."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_session = GameSession.objects.create(game=other_game, title='Other Session')
        serializer = GameTaskUpdateSerializer(
            self.task,
            data={'session': other_session.id},
            partial=True,
            context={'game': self.game},
        )
        assert not serializer.is_valid()
        assert 'session' in serializer.errors

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = GameTaskUpdateSerializer(self.task).data
        assert 'game' not in data

    def test_game_is_not_changed_via_update(self):
        """Test that game cannot be reassigned via the update payload, even if supplied."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        serializer = GameTaskUpdateSerializer(
            self.task,
            data={
                'short_description': 'Prep the escape',
                'game': other_game.id,
                'game_id': other_game.id,
            },
            partial=True,
            context={'game': self.game},
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.short_description == 'Prep the escape'
        assert updated.game == self.game

    def _build(self, data):
        """Build a partial update serializer for the task with the given data."""
        return GameTaskUpdateSerializer(
            self.task, data=data, partial=True, context={'game': self.game},
        )

    def test_category_can_be_changed(self):
        """Test that a valid category change is saved."""
        serializer = self._build({'category': 'writing'})
        assert serializer.is_valid()
        task = serializer.save()
        assert task.category == 'writing'

    def test_category_unchanged_when_omitted(self):
        """Test that omitting category keeps the current value."""
        self.task.category = Task.CATEGORY_BUYING
        self.task.save()
        serializer = self._build({'completed': True})
        assert serializer.is_valid()
        task = serializer.save()
        assert task.category == 'buying'

    def test_unknown_category_is_rejected(self):
        """Test that an unknown category is rejected with invalid_choice."""
        serializer = self._build({'category': 'cooking'})
        assert not serializer.is_valid()
        assert [error.code for error in serializer.errors['category']] == ['invalid_choice']

    def test_null_category_is_rejected(self):
        """Test that a null category is rejected."""
        serializer = self._build({'category': None})
        assert not serializer.is_valid()
        assert [error.code for error in serializer.errors['category']] == ['null']

    def test_blank_category_is_rejected(self):
        """Test that an empty category is rejected."""
        serializer = self._build({'category': ''})
        assert not serializer.is_valid()
        assert [error.code for error in serializer.errors['category']] == ['invalid_choice']
