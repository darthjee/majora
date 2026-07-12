"""Tests for the Task model."""

import pytest
from django.contrib.auth.models import AnonymousUser

from games.models import GameSession, Task
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


@pytest.mark.django_db
class TestTask:
    """Tests for the Task model."""

    def setup_method(self):
        """Set up a game for testing."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_task_creation(self):
        """Test that a task can be created with a game and short description."""
        task = Task.objects.create(game=self.game, short_description='Prep the ambush')
        assert task.game == self.game
        assert task.short_description == 'Prep the ambush'
        assert task.long_description == ''
        assert task.session is None

    def test_task_defaults_to_not_completed(self):
        """Test that a task defaults to completed=False."""
        task = Task.objects.create(game=self.game, short_description='Prep the ambush')
        assert task.completed is False

    def test_task_creation_with_session(self):
        """Test that a task can be linked to a session of the same game."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        task = Task.objects.create(
            game=self.game, short_description='Prep the ambush', session=session
        )
        assert task.session == session

    def test_task_str(self):
        """Test string representation of a task."""
        task = Task(game=self.game, short_description='Prep the ambush')
        assert str(task) == 'Prep the ambush'

    def test_task_ordering(self):
        """Test that tasks are ordered by id."""
        first = Task.objects.create(game=self.game, short_description='Zebra Task')
        second = Task.objects.create(game=self.game, short_description='Alpha Task')
        tasks = list(Task.objects.all())
        assert tasks[0].id == first.id
        assert tasks[1].id == second.id


@pytest.mark.django_db
class TestTaskCanBeEditedBy:
    """Tests for Task.can_be_edited_by()."""

    def setup_method(self):
        """Set up a game, a task, and a DM user."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.task = Task.objects.create(game=self.game, short_description='Prep the ambush')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the task."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        assert self.task.can_be_edited_by(superuser) is True

    def test_dm_of_game_can_edit(self):
        """Test that a DM of the task's game may edit it."""
        assert self.task.can_be_edited_by(self.dm_user) is True

    def test_dm_of_other_game_cannot_edit(self):
        """Test that a DM of a different game cannot edit the task."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_dm = UserFactory(username='other_dm', password='secret-password')
        GameMasterFactory(game=other_game, user=other_dm)
        assert self.task.can_be_edited_by(other_dm) is False

    def test_non_dm_user_cannot_edit(self):
        """Test that a regular user who is not a DM cannot edit the task."""
        other = UserFactory(username='other', password='secret-password')
        assert self.task.can_be_edited_by(other) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.task.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.task.can_be_edited_by(AnonymousUser()) is False


@pytest.mark.django_db
class TestTaskCanBeEditedByRoles:
    """Tests for Task.can_be_edited_by_roles()."""

    def setup_method(self):
        """Set up a game and a task for testing."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.task = Task.objects.create(game=self.game, short_description='Prep the ambush')

    def test_superuser_role_can_edit(self):
        """Test that the superuser role may edit the task."""
        assert self.task.can_be_edited_by_roles(is_superuser=True, is_dm=False) is True

    def test_dm_role_can_edit(self):
        """Test that the dm role may edit the task."""
        assert self.task.can_be_edited_by_roles(is_superuser=False, is_dm=True) is True

    def test_no_roles_cannot_edit(self):
        """Test that neither role present may not edit the task."""
        assert self.task.can_be_edited_by_roles(is_superuser=False, is_dm=False) is False
