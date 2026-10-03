"""Shared logic for attributing a request to a `Visit` of a statistics `Session`."""

from datetime import timedelta

from django.db.models import F
from django.utils import timezone

from statistics.models import Visit
from statistics.settings import Settings


def track_visit(session, *, new_session=False):
    """Extend the latest visit of `session` if still inside the inactivity window, else open one.

    Extending is a single atomic `UPDATE` (`hits = hits + 1`), so concurrent requests never
    lose a hit. A session created during this request (`new_session=True`) cannot have a
    visit yet, so the lookup is skipped and a visit is opened directly.
    """
    now = timezone.now()
    if new_session or not _extend_latest_visit(session, now):
        Visit.objects.create(session=session, started_at=now, last_seen_at=now, hits=1)


def _extend_latest_visit(session, now):
    """Atomically bump the latest visit of `session` if still active; return whether it did."""
    latest_pk = session.visits.order_by('-last_seen_at').values_list('pk', flat=True).first()
    if latest_pk is None:
        return False

    cutoff = now - timedelta(seconds=Settings.visit_inactivity_seconds())
    updated = Visit.objects.filter(pk=latest_pk, last_seen_at__gte=cutoff).update(
        hits=F('hits') + 1, last_seen_at=now,
    )
    return bool(updated)
