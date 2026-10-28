"""Tests for the `attach_user` shared helper."""

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.models import Session
from statistics.session_attachment import attach_user


@pytest.mark.django_db
class TestAttachUser:
    """Tests for `attach_user`."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = UserFactory(username='alice')
        self.domain = DomainFactory(domain='example.com')

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

    def test_always_rotate_creates_new_session_even_when_anonymous(self):
        """Test that `always_rotate=True` rotates even when the session had no user yet."""
        session = Session.objects.create(ip='1.2.3.4')

        result = attach_user(session, self.user, always_rotate=True)

        assert result.id != session.id
        assert result.user_id == self.user.id
        assert result.ip == session.ip
        session.refresh_from_db()
        assert session.user_id is None

    def test_rotation_carries_the_original_sessions_domain_forward(self):
        """Test that a rotated session keeps the original session's `domain`."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)

        result = attach_user(session, self.user, always_rotate=True)

        assert result.id != session.id
        assert result.domain_id == self.domain.id

    def test_rotates_when_in_place_update_loses_a_race(self):
        """Test that a concurrently-claimed row falls through to rotation instead of failing."""
        session = Session.objects.create(ip='1.2.3.4')
        other_user = UserFactory(username='carol')
        # Simulate another request claiming this row between our read and write.
        Session.objects.filter(pk=session.pk).update(user=other_user)

        result = attach_user(session, self.user)

        assert result.id != session.id
        assert result.user_id == self.user.id
        session.refresh_from_db()
        assert session.user_id == other_user.id

    def test_rotates_to_a_new_session_when_the_session_was_deleted(self):
        """Test that a deleted anonymous session falls through to a new user-tied session."""
        session = self._deleted_session()

        result = attach_user(session, self.user)

        self._assert_rotated_from(result, session)

    def test_always_rotate_creates_a_new_session_when_the_session_was_deleted(self):
        """Test that `always_rotate=True` on a deleted session creates a new user-tied one."""
        session = self._deleted_session()

        result = attach_user(session, self.user, always_rotate=True)

        self._assert_rotated_from(result, session)

    def _deleted_session(self):
        """Return an anonymous session whose row is deleted but whose instance keeps its pk."""
        session = Session.objects.create(ip='1.2.3.4', domain=self.domain)
        Session.objects.filter(pk=session.pk).delete()
        return session

    def _assert_rotated_from(self, result, session):
        """Assert `result` is a new stored session tied to `self.user`, copying `session`."""
        assert result.id != session.id
        assert Session.objects.get() == result
        assert result.user_id == self.user.id
        assert result.ip == session.ip
        assert result.domain_id == self.domain.id
