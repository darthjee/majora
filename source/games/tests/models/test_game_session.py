"""Tests for the GameSession model."""

import pytest
from django.contrib.auth.models import AnonymousUser, User

from games.models import Game, GameMaster, GameSession


@pytest.mark.django_db
class TestGameSession:

    """Tests for the GameSession model."""

    def setup_method(self):
        """Set up a game for testing."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

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


@pytest.mark.django_db
class TestGameSessionCanBeEditedBy:

    """Tests for GameSession.can_be_edited_by()."""

    def setup_method(self):
        """Set up a game, a session, and a DM user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.session = GameSession.objects.create(game=self.game, title='Session One')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)

    def test_superuser_can_edit(self):
        """Test that a superuser may edit the session."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        assert self.session.can_be_edited_by(superuser) is True

    def test_dm_of_game_can_edit(self):
        """Test that a DM of the session's game may edit it."""
        assert self.session.can_be_edited_by(self.dm_user) is True

    def test_dm_of_other_game_cannot_edit(self):
        """Test that a DM of a different game cannot edit the session."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        other_dm = User.objects.create_user(username='other_dm', password='secret-password')
        GameMaster.objects.create(game=other_game, user=other_dm)
        assert self.session.can_be_edited_by(other_dm) is False

    def test_non_dm_user_cannot_edit(self):
        """Test that a regular user who is not a DM cannot edit the session."""
        other = User.objects.create_user(username='other', password='secret-password')
        assert self.session.can_be_edited_by(other) is False

    def test_none_user_cannot_edit(self):
        """Test that None as user returns False."""
        assert self.session.can_be_edited_by(None) is False

    def test_anonymous_user_cannot_edit(self):
        """Test that an anonymous user returns False."""
        assert self.session.can_be_edited_by(AnonymousUser()) is False
