"""Tests for the StaffStatisticsVisitSerializer."""

from datetime import datetime, timedelta, timezone

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory, UserProfileFactory
from staff.serializers import StaffStatisticsVisitSerializer
from statistics.models import Session, Visit

STARTED_AT = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)


def _visit(session, seconds=95, hits=4):
    """Create a visit of `session` lasting `seconds` (plus sub-seconds) with `hits`."""
    return Visit.objects.create(
        session=session, started_at=STARTED_AT,
        last_seen_at=STARTED_AT + timedelta(seconds=seconds, milliseconds=700), hits=hits,
    )


def _data(visit, now=None):
    """Serialize `visit` with `now` in the context (defaults to well after the visit)."""
    now = now or STARTED_AT + timedelta(days=1)
    return StaffStatisticsVisitSerializer(visit, context={'now': now}).data


@pytest.mark.django_db
class TestStaffStatisticsVisitSerializerKeys:
    """Tests for the keys and values of a logged-in, domain-bound visit row."""

    def setup_method(self):
        """Set up a logged-in visit on a known domain."""
        self.user = UserFactory(username='aria', email='aria@example.com')
        UserProfileFactory(user=self.user, display_name='Aria Stormwind')
        self.domain = DomainFactory(domain='alpha.example.com')
        self.session = Session.objects.create(ip='10.0.0.7', user=self.user, domain=self.domain)
        self.visit = _visit(self.session)

    def test_row(self):
        """Test that every key is serialized, in the spec's order, with its value."""
        data = _data(self.visit)
        assert list(data.keys()) == [
            'id', 'started_at', 'last_seen_at', 'duration_seconds', 'hits', 'ongoing',
            'ip', 'domain', 'session_id', 'user',
        ]
        assert dict(data) == {
            'id': self.visit.id,
            'started_at': '2026-01-01T12:00:00Z',
            'last_seen_at': '2026-01-01T12:01:35Z',
            'duration_seconds': 95,
            'hits': 4,
            'ongoing': False,
            'ip': '10.0.0.7',
            'domain': {'id': self.domain.id, 'domain': 'alpha.example.com'},
            'session_id': self.session.id,
            'user': {
                'id': self.user.id, 'name': 'aria', 'display_name': 'Aria Stormwind',
                'email': 'aria@example.com',
            },
        }

    def test_token_is_never_serialized(self):
        """Test that the session token appears nowhere in the row."""
        data = _data(self.visit)
        assert 'token' not in data
        assert self.session.token not in str(data)

    def test_duration_is_an_int(self):
        """Test that the duration is a truncated integer."""
        assert isinstance(_data(self.visit)['duration_seconds'], int)


@pytest.mark.django_db
class TestStaffStatisticsVisitSerializerOngoing:
    """Tests for the `ongoing` flag of a visit row."""

    def setup_method(self):
        """Set up a visit and its last hit."""
        self.visit = _visit(Session.objects.create(ip='127.0.0.1'))
        self.last_seen_at = self.visit.last_seen_at

    def test_inside_the_window(self, monkeypatch):
        """Test that a visit seen just inside the inactivity window is ongoing."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '60')
        now = self.last_seen_at + timedelta(seconds=59)
        assert _data(self.visit, now)['ongoing'] is True

    def test_at_the_window(self, monkeypatch):
        """Test that a visit seen exactly one window ago is not ongoing."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '60')
        now = self.last_seen_at + timedelta(seconds=60)
        assert _data(self.visit, now)['ongoing'] is False

    def test_beyond_the_window(self, monkeypatch):
        """Test that a visit seen beyond the window is not ongoing."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '60')
        now = self.last_seen_at + timedelta(seconds=61)
        assert _data(self.visit, now)['ongoing'] is False


@pytest.mark.django_db
class TestStaffStatisticsVisitSerializerAnonymous:
    """Tests for an anonymous, single-hit visit without a domain."""

    def setup_method(self):
        """Set up an anonymous single-hit visit without a domain."""
        self.visit = _visit(Session.objects.create(ip='::1'), seconds=0, hits=1)

    def test_user_is_none(self):
        """Test that an anonymous visit has a `None` user."""
        assert _data(self.visit)['user'] is None

    def test_unknown_domain(self):
        """Test that a visit without a domain gives the unknown domain entry."""
        assert _data(self.visit)['domain'] == {'id': 'unknown', 'domain': None}

    def test_single_hit_duration_is_zero(self):
        """Test that a single-hit visit lasts zero seconds."""
        visit = Visit.objects.create(
            session=self.visit.session, started_at=STARTED_AT, last_seen_at=STARTED_AT,
        )
        data = _data(visit)
        assert data['duration_seconds'] == 0
        assert data['hits'] == 1

    def test_deleted_user_is_none(self):
        """Test that a visit of a deleted user has a `None` user."""
        user = UserFactory()
        visit = _visit(Session.objects.create(ip='127.0.0.1', user=user))
        user.delete()
        assert _data(Visit.objects.select_related('session').get(pk=visit.pk))['user'] is None
