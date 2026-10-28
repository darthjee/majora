"""Tests for the batched statistics reset (`statistics.reset`)."""

from unittest import mock

import pytest

from statistics import reset as reset_module
from statistics.models import Session, Visit
from statistics.reset import StatisticsReset, StatisticsResetLimitExceeded


def _create_rows(sessions=3, visits_per_session=2):
    """Create `sessions` sessions, each with `visits_per_session` visits; return the sessions."""
    created = [Session.objects.create(ip='127.0.0.1') for _ in range(sessions)]
    for session in created:
        for _ in range(visits_per_session):
            Visit.objects.create(session=session)
    return created


@pytest.mark.django_db(transaction=True)
class TestStatisticsReset:
    """Tests for `StatisticsReset.run()`."""

    def setup_method(self):
        """Set up three sessions with two visits each."""
        _create_rows()

    def test_deletes_every_row(self):
        """Test that every visit and session is deleted."""
        StatisticsReset().run()
        assert Visit.objects.count() == 0
        assert Session.objects.count() == 0

    def test_counts_deleted_rows(self):
        """Test that the counters match the rows deleted."""
        reset = StatisticsReset().run()
        assert reset.deleted_visits == 6
        assert reset.deleted_sessions == 3

    def test_run_returns_self(self):
        """Test that `run()` returns the reset object itself."""
        reset = StatisticsReset()
        assert reset.run() is reset

    def test_resets_ids(self):
        """Test that the next session and visit created both get id 1."""
        StatisticsReset().run()
        session = Session.objects.create(ip='127.0.0.1')
        visit = Visit.objects.create(session=session)
        assert session.id == 1
        assert visit.id == 1

    def test_small_batches_remove_every_row(self):
        """Test that a batch size of 2 still removes every row over several batches."""
        reset = StatisticsReset(batch_size=2).run()
        assert (reset.deleted_visits, reset.deleted_sessions) == (6, 3)
        assert not Visit.objects.exists()
        assert not Session.objects.exists()

    def test_sessions_pass_deletes_visits_added_after_visits_pass(self):
        """Test that a visit added after the visits pass is deleted with its session."""
        reset = StatisticsReset(batch_size=2)
        real_pass = reset._delete_visits

        def _pass_then_add_visit():
            real_pass()
            Visit.objects.create(session=Session.objects.order_by('-id').first())

        with mock.patch.object(reset, '_delete_visits', side_effect=_pass_then_add_visit):
            reset.run()
        assert reset.deleted_visits == 7
        assert not Visit.objects.exists()
        assert not Session.objects.exists()

    def test_limit_exceeded_raises(self):
        """Test that going over `MAX_BATCHES` raises `StatisticsResetLimitExceeded`."""
        with mock.patch.object(reset_module, 'MAX_BATCHES', 1):
            with pytest.raises(StatisticsResetLimitExceeded):
                StatisticsReset(batch_size=1).run()

    def test_limit_exceeded_keeps_partial_counts(self):
        """Test that the counts reached before the safety limit stay on the object."""
        reset = StatisticsReset(batch_size=1)
        with mock.patch.object(reset_module, 'MAX_BATCHES', 1):
            with pytest.raises(StatisticsResetLimitExceeded):
                reset.run()
        assert reset.deleted_visits > 0
        assert reset.deleted_sessions == 0


@pytest.mark.django_db(transaction=True)
class TestStatisticsResetEmpty:
    """Tests for `StatisticsReset.run()` on empty tables."""

    def test_returns_zero_counts(self):
        """Test that an empty dataset gives zero counts and does not fail."""
        reset = StatisticsReset().run()
        assert (reset.deleted_visits, reset.deleted_sessions) == (0, 0)


class TestStatisticsResetBatchSize:
    """Tests for `StatisticsReset` batch-size defaults."""

    def test_defaults_to_setting(self, monkeypatch):
        """Test that the batch size defaults to `Settings.clear_batch_size()`."""
        monkeypatch.setenv('MAJORA_STATISTICS_CLEAR_BATCH_SIZE', '7')
        assert StatisticsReset().batch_size == 7

    def test_uses_given_batch_size(self):
        """Test that an explicit batch size is used."""
        assert StatisticsReset(batch_size=3).batch_size == 3
