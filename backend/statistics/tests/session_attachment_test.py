"""Tests for the `attach_user` shared helper."""

import pytest

from games.tests.factories import UserFactory
from statistics.models import Session
from statistics.session_attachment import attach_user


@pytest.mark.django_db
class TestAttachUser:
    """Tests for `attach_user`."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = UserFactory(username='alice')

    def test_attaches_user_to_anonymous_session_in_place(self):
        """Test that an anonymous session is updated in place and returned."""
        session = Session.objects.create(ip='1.2.3.4')

        result = attach_user(session, self.user)

        assert result.id == session.id
        session.refresh_from_db()
        assert session.user_id == self.user.id

    def test_returns_same_row_when_attaching_to_anonymous_session(self):
        """Test that no extra `Session` row is created when attaching to an anonymous one."""
        session = Session.objects.create(ip='1.2.3.4')

        attach_user(session, self.user)

        assert Session.objects.count() == 1

    def test_rotates_to_a_new_session_when_already_tied_to_a_different_user(self):
        """Test that a session tied to another user is rotated to a brand-new one."""
        other_user = UserFactory(username='bob')
        session = Session.objects.create(ip='1.2.3.4', user=other_user)

        result = attach_user(session, self.user)

        assert result.id != session.id
        assert result.user_id == self.user.id
        assert result.ip == session.ip
        session.refresh_from_db()
        assert session.user_id == other_user.id

    def test_rotates_to_a_new_session_when_re_attaching_the_same_user(self):
        """Test that a session already tied to the same user still rotates."""
        session = Session.objects.create(ip='1.2.3.4', user=self.user)

        result = attach_user(session, self.user)

        assert result.id != session.id
        assert result.user_id == self.user.id
        assert Session.objects.count() == 2
