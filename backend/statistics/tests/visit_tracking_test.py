"""Tests for `statistics.visit_tracking.track_visit`."""

from datetime import timedelta

import pytest
from django.utils import timezone

from statistics.models import Session, Visit
from statistics.visit_tracking import track_visit


@pytest.mark.django_db
class TestTrackVisit:
    """Tests for `track_visit`."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.session = Session.objects.create(ip='127.0.0.1')

    def test_opens_a_visit_when_session_has_none(self):
        """Test that a session without visits gets a new one with one hit."""
        track_visit(self.session)

        visit = self.session.visits.get()
        assert visit.hits == 1

    def test_opens_a_visit_directly_for_a_new_session(self):
        """Test that `new_session=True` opens a visit without looking up previous ones."""
        track_visit(self.session, new_session=True)

        assert self.session.visits.get().hits == 1

    def test_extends_the_latest_visit_inside_the_window(self):
        """Test that a visit still inside the window gets one more hit and a fresh timestamp."""
        visit = self._visit_seen(minutes_ago=5)
        previous_last_seen_at = visit.last_seen_at

        track_visit(self.session)

        visit.refresh_from_db()
        assert Visit.objects.count() == 1
        assert visit.hits == 2
        assert visit.last_seen_at > previous_last_seen_at

    def test_opens_a_new_visit_after_the_window(self):
        """Test that a visit older than the window is left alone and a new one is opened."""
        visit = self._visit_seen(minutes_ago=31)

        track_visit(self.session)

        visit.refresh_from_db()
        assert visit.hits == 1
        assert self.session.visits.count() == 2

    def test_only_extends_the_latest_visit(self):
        """Test that the most recent visit is the one extended."""
        older = self._visit_seen(minutes_ago=20)
        latest = self._visit_seen(minutes_ago=2)

        track_visit(self.session)

        older.refresh_from_db()
        latest.refresh_from_db()
        assert older.hits == 1
        assert latest.hits == 2

    def test_window_is_configurable(self, monkeypatch):
        """Test that a shorter configured window expires visits sooner."""
        monkeypatch.setenv('MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS', '60')
        self._visit_seen(minutes_ago=2)

        track_visit(self.session)

        assert self.session.visits.count() == 2

    def _visit_seen(self, minutes_ago):
        """Return a visit of `self.session` last seen `minutes_ago` minutes ago."""
        seen_at = timezone.now() - timedelta(minutes=minutes_ago)
        return Visit.objects.create(session=self.session, started_at=seen_at, last_seen_at=seen_at)
