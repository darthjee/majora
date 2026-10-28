# Skip the visit for a deleted session

In `backend/statistics/visit_tracking.py`, `track_visit` opens a visit with
`Visit.objects.create(session=session, ...)`. For a deleted session that insert violates the
`Visit.session` foreign key and raises `IntegrityError`. (The extend path is already safe: its
`UPDATE` just matches 0 rows and falls through to the create.)

Move the create into a small private helper that runs it inside a savepoint and swallows only
`IntegrityError`:

```python
from django.db import IntegrityError, transaction


def _open_visit(session, now):
    """Open a visit for `session`; skip silently if the session vanished mid-request."""
    try:
        with transaction.atomic():
            Visit.objects.create(session=session, started_at=now, last_seen_at=now, hits=1)
    except IntegrityError:
        pass
```

- The `transaction.atomic()` savepoint is required so a caught error does not poison an outer
  transaction.
- Update `track_visit`'s docstring: a session deleted mid-request (e.g. by a statistics clear)
  gets no visit and no error.

Unit tests in `backend/statistics/tests/visit_tracking_test.py`:

- `track_visit` on a session deleted beforehand (`session.delete()` keeps the in-memory pk)
  raises nothing and creates no `Visit`, for both `new_session=True` and the default path.
- After the swallowed error, a further query in the same test (e.g. `Visit.objects.count()`)
  still works — proves the savepoint protects the outer transaction.

## Files to Change

- `backend/statistics/visit_tracking.py` — `_open_visit` helper with savepoint + `IntegrityError` catch.
- `backend/statistics/tests/visit_tracking_test.py` — deleted-session tests.
