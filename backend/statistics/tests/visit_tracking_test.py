"""Tests for `statistics.visit_tracking.track_visit`."""

import threading
from datetime import timedelta

import pytest
from django.db import connection
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

    def test_skips_the_visit_for_a_deleted_new_session(self):
        """Test that a session deleted before tracking (new-session path) gets no visit."""
        self._delete_session_row()

        track_visit(self.session, new_session=True)

        assert Visit.objects.count() == 0

    def test_skips_the_visit_for_a_deleted_reused_session(self):
        """Test that a session deleted before tracking (default path) gets no visit."""
        self._delete_session_row()

        track_visit(self.session)

        assert Visit.objects.count() == 0

    def test_outer_transaction_survives_a_skipped_visit(self):
        """Test that queries still work after the swallowed `IntegrityError`."""
        self._delete_session_row()
        track_visit(self.session, new_session=True)

        other = Session.objects.create(ip='127.0.0.2')
        track_visit(other, new_session=True)

        assert Visit.objects.filter(session=other).count() == 1

    def test_opened_visit_stores_the_path_as_first_and_last(self):
        """Test that an opened visit records `path` as both `first_path` and `last_path`."""
        track_visit(self.session, path='games.json')

        visit = self.session.visits.get()
        assert visit.first_path == 'games.json'
        assert visit.last_path == 'games.json'

    def test_extended_visit_updates_only_the_last_path(self):
        """Test that extending a visit updates `last_path` and keeps `first_path`."""
        track_visit(self.session, path='games.json')

        track_visit(self.session, path='games/<slug:game_slug>.json')

        visit = self.session.visits.get()
        assert visit.hits == 2
        assert visit.first_path == 'games.json'
        assert visit.last_path == 'games/<slug:game_slug>.json'

    def test_extend_path_keeps_its_query_count(self, django_assert_num_queries):
        """Test that extending with a path is still one lookup plus one `UPDATE`."""
        track_visit(self.session, path='games.json')

        with django_assert_num_queries(2):
            track_visit(self.session, path='ready.json')

    def test_open_path_keeps_its_query_count(self, django_assert_num_queries):
        """Test that opening a new-session visit with a path is still one savepointed `INSERT`."""
        with django_assert_num_queries(3):
            track_visit(self.session, new_session=True, path='games.json')

    def _delete_session_row(self):
        """Delete `self.session`'s row while keeping the in-memory instance and its pk."""
        Session.objects.filter(pk=self.session.pk).delete()

    def _visit_seen(self, minutes_ago):
        """Return a visit of `self.session` last seen `minutes_ago` minutes ago."""
        seen_at = timezone.now() - timedelta(minutes=minutes_ago)
        return Visit.objects.create(session=self.session, started_at=seen_at, last_seen_at=seen_at)


@pytest.mark.django_db(transaction=True)
class TestTrackVisitConcurrency:
    """Tests for concurrent `track_visit` extends."""

    THREADS = 4

    def setup_method(self):
        """Set up a session with one open visit."""
        self.session = Session.objects.create(ip='127.0.0.1')
        track_visit(self.session, path='games.json')

    def test_concurrent_extends_lose_no_hit(self):
        """Test that simultaneous extends with paths still count every hit."""
        barrier = threading.Barrier(self.THREADS)
        threads = [
            threading.Thread(target=self._extend, args=(barrier,)) for _ in range(self.THREADS)
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        visit = self.session.visits.get()
        assert visit.hits == 1 + self.THREADS
        assert visit.last_path == 'ready.json'

    def _extend(self, barrier):
        """Wait for every thread, extend the visit, then release this thread's connection."""
        barrier.wait()
        try:
            track_visit(Session.objects.get(pk=self.session.pk), path='ready.json')
        finally:
            connection.close()
