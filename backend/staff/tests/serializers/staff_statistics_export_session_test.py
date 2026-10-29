"""Tests for the staff statistics export session and visit serializers."""

from datetime import datetime, timedelta, timezone

import pytest

from staff.serializers import (
    StaffStatisticsExportSessionSerializer,
    StaffStatisticsExportVisitSerializer,
)
from statistics.models import Session, Visit

START = datetime(2026, 1, 2, 9, tzinfo=timezone.utc)


def _visit(session, minutes=0):
    """Return an unsaved visit of `session` started `minutes` after `START`."""
    started_at = START + timedelta(minutes=minutes)
    return Visit(session=session, started_at=started_at, last_seen_at=started_at, hits=2)


@pytest.mark.django_db
class TestStaffStatisticsExportSessionSerializer:
    """Tests for StaffStatisticsExportSessionSerializer."""

    def setup_method(self):
        """Set up an anonymous session without a domain."""
        self.session = Session.objects.create(ip='198.51.100.9')

    def _data(self, visits):
        """Serialize the session with `visits` as its batched visits."""
        context = {'visits': {self.session.id: visits}}
        return StaffStatisticsExportSessionSerializer(self.session, context=context).data

    def test_never_exposes_token(self):
        """Test that the session token is not a serialized field."""
        assert 'token' not in self._data([])

    def test_no_visits(self):
        """Test that a session without loaded visits gives an empty, untruncated list."""
        data = StaffStatisticsExportSessionSerializer(
            self.session, context={'visits': {}},
        ).data
        assert data['visits'] == []
        assert data['visits_truncated'] is False

    def test_cut_off_at_cap(self):
        """Test that the extra loaded visit is dropped and flagged."""
        visits = [_visit(self.session, index) for index in range(101)]
        data = self._data(visits)
        assert len(data['visits']) == 100
        assert data['visits_truncated'] is True

    def test_visit_fields(self):
        """Test that a visit serializes its start, last hit and hits only."""
        data = StaffStatisticsExportVisitSerializer(_visit(self.session)).data
        assert data == {
            'started_at': '2026-01-02T09:00:00Z',
            'last_seen_at': '2026-01-02T09:00:00Z',
            'hits': 2,
        }
