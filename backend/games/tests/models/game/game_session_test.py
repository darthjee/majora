"""Tests for the GameSession model."""

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from games.models import GameSession
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestGameSession(TestCase):
    """Tests for the GameSession model."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_game_session_creation(self):
        """Test that a session can be created with a game and title."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        assert session.game == self.game
        assert session.title == 'Session One'
        assert session.date is None

    def test_game_session_creation_with_date(self):
        """Test that a session can be created with an optional date."""
        session = GameSession.objects.create(
            game=self.game, title='Session Two', date='2026-01-01'
        )
        assert str(session.date) == '2026-01-01'

    def test_game_session_creation_without_description(self):
        """Test that description defaults to None when not provided."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        assert session.description is None

    def test_game_session_creation_with_description(self):
        """Test that a session can be created with an optional description."""
        session = GameSession.objects.create(
            game=self.game, title='Session Two', description='Notes about the session.'
        )
        assert session.description == 'Notes about the session.'

    def test_game_session_str(self):
        """Test string representation of a session."""
        session = GameSession(game=self.game, title='The Ambush')
        assert str(session) == 'The Ambush'

    def test_game_session_ordering(self):
        """Test that sessions are ordered by id."""
        first = GameSession.objects.create(game=self.game, title='Zebra Session')
        second = GameSession.objects.create(game=self.game, title='Alpha Session')
        sessions = list(GameSession.objects.all())
        assert sessions[0].id == first.id
        assert sessions[1].id == second.id


class TestGameSessionCanBeEditedBy(TestCase):
    """Tests for GameSession.can_be_edited_by()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, and a DM user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the session."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        assert self.session.can_be_edited_by(superuser) is True

    def test_dm_of_game_can_edit(self):
        """Test that a DM of the session's game may edit it."""
        assert self.session.can_be_edited_by(self.dm_user) is True

    def test_dm_of_other_game_cannot_edit(self):
        """Test that a DM of a different game cannot edit the session."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_dm = UserFactory(username='other_dm', password='secret-password')
        PlayerFactory(game=other_game, user=other_dm, is_dm=True)
        assert self.session.can_be_edited_by(other_dm) is False

    def test_non_dm_user_cannot_edit(self):
        """Test that a regular user who is not a DM cannot edit the session."""
        other = UserFactory(username='other', password='secret-password')
        assert self.session.can_be_edited_by(other) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.session.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.session.can_be_edited_by(AnonymousUser()) is False


class TestGameSessionCanBeEditedByRoles(TestCase):
    """Tests for GameSession.can_be_edited_by_roles()."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a session for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')

    def test_superuser_role_can_edit(self):
        """Test that the superuser role may edit the session."""
        assert self.session.can_be_edited_by_roles(is_superuser=True, is_dm=False) is True

    def test_dm_role_can_edit(self):
        """Test that the dm role may edit the session."""
        assert self.session.can_be_edited_by_roles(is_superuser=False, is_dm=True) is True

    def test_no_roles_cannot_edit(self):
        """Test that neither role present may not edit the session."""
        assert self.session.can_be_edited_by_roles(is_superuser=False, is_dm=False) is False
