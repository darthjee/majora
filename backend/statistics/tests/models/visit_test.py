"""Tests for the `Visit` model."""

import pytest

from statistics.models import Session, Visit


@pytest.mark.django_db
class TestVisit:
    """Tests for the `Visit` model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.session = Session.objects.create(ip='127.0.0.1')

    def test_hits_defaults_to_one(self):
        """Test that a new visit counts its opening request."""
        visit = Visit.objects.create(session=self.session)

        assert visit.hits == 1

    def test_timestamps_default_to_now(self):
        """Test that `started_at` and `last_seen_at` are set by default."""
        visit = Visit.objects.create(session=self.session)

        assert visit.started_at is not None
        assert visit.last_seen_at is not None

    def test_is_reachable_from_its_session(self):
        """Test that a session exposes its visits through `visits`."""
        visit = Visit.objects.create(session=self.session)

        assert list(self.session.visits.all()) == [visit]

    def test_deleting_session_deletes_its_visits(self):
        """Test that visits cascade with their session."""
        Visit.objects.create(session=self.session)

        self.session.delete()

        assert Visit.objects.count() == 0

    def test_paths_default_to_none(self):
        """Test that `first_path` and `last_path` are `None` when not provided."""
        visit = Visit.objects.create(session=self.session)

        assert visit.first_path is None
        assert visit.last_path is None

    def test_paths_can_be_set(self):
        """Test that `first_path` and `last_path` persist their values."""
        visit = Visit.objects.create(
            session=self.session, first_path='games.json', last_path='games/<slug:game_slug>.json',
        )
        visit.refresh_from_db()

        assert visit.first_path == 'games.json'
        assert visit.last_path == 'games/<slug:game_slug>.json'
