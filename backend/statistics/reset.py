"""Clears all visit statistics and resets their auto-increment ids.

The SQL is raw (and MySQL-specific) on purpose: it skips Django's Python-side
`Visit.session` cascade, `TRUNCATE` is refused because of the foreign key, and
`ALTER TABLE` commits implicitly, so nothing here runs inside `atomic()`.
"""

from django.db import connection

from statistics.models import Session, Visit
from statistics.settings import Settings

MAX_BATCHES = 1000


class StatisticsResetLimitExceeded(Exception):
    """Raised when a delete loop runs more than `MAX_BATCHES` batches."""


class StatisticsReset:
    """Deletes every visit and session in batches, keeping running counts of deleted rows."""

    def __init__(self, batch_size=None):
        """Store the batch size (default from settings) and zero the counters."""
        self.batch_size = batch_size or Settings.clear_batch_size()
        self.deleted_visits = 0
        self.deleted_sessions = 0

    def run(self):
        """Run the visits pass, the sessions pass and the id reset; return `self`."""
        self._delete_visits()
        self._delete_sessions()
        self._reset_ids()
        return self

    def _delete_visits(self):
        """Delete visits in batches until none are left."""
        self._loop(self._delete_visits_batch)

    def _delete_sessions(self):
        """Delete sessions (and any visits still attached) in batches until none are left."""
        self._loop(self._delete_sessions_batch)

    def _reset_ids(self):
        """Reset the auto-increment counter of both tables to 1."""
        with connection.cursor() as cursor:
            cursor.execute(f'ALTER TABLE {_visit_table()} AUTO_INCREMENT = 1')
            cursor.execute(f'ALTER TABLE {_session_table()} AUTO_INCREMENT = 1')

    def _loop(self, batch_fn):
        """Call `batch_fn` until it reports 0 rows, failing after `MAX_BATCHES` batches."""
        batches = 0
        while batch_fn():
            batches += 1
            if batches > MAX_BATCHES:
                raise StatisticsResetLimitExceeded(
                    f'statistics clear exceeded {MAX_BATCHES} batches'
                )

    def _delete_visits_batch(self):
        """Delete one batch of visits; return the number of rows deleted."""
        with connection.cursor() as cursor:
            cursor.execute(
                f'DELETE FROM {_visit_table()} ORDER BY id LIMIT %s', [self.batch_size]
            )
            self.deleted_visits += cursor.rowcount
            return cursor.rowcount

    def _delete_sessions_batch(self):
        """Delete one batch of sessions and their visits; return the number of sessions found."""
        ids = self._select_session_ids()
        if ids:
            self._delete_visits_of(ids)
            self._delete_sessions_by_id(ids)
        return len(ids)

    def _select_session_ids(self):
        """Return up to `batch_size` session ids, ordered by id."""
        with connection.cursor() as cursor:
            cursor.execute(
                f'SELECT id FROM {_session_table()} ORDER BY id LIMIT %s', [self.batch_size]
            )
            return [row[0] for row in cursor.fetchall()]

    def _delete_visits_of(self, ids):
        """Delete the visits attached to the given session ids."""
        with connection.cursor() as cursor:
            cursor.execute(
                f'DELETE FROM {_visit_table()} WHERE session_id IN ({_placeholders(ids)})', ids
            )
            self.deleted_visits += cursor.rowcount

    def _delete_sessions_by_id(self, ids):
        """Delete the sessions with the given ids."""
        with connection.cursor() as cursor:
            cursor.execute(
                f'DELETE FROM {_session_table()} WHERE id IN ({_placeholders(ids)})', ids
            )
            self.deleted_sessions += cursor.rowcount


def _visit_table():
    """Return the quoted visit table name."""
    return connection.ops.quote_name(Visit._meta.db_table)


def _session_table():
    """Return the quoted session table name."""
    return connection.ops.quote_name(Session._meta.db_table)


def _placeholders(ids):
    """Return a comma-separated list of `%s` placeholders, one per id."""
    return ', '.join(['%s'] * len(ids))
