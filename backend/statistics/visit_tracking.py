"""Shared logic for attributing a request to a `Visit` of a statistics `Session`."""

from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from statistics.models import Visit
from statistics.settings import Settings


def track_visit(session, *, new_session=False, path=None, ip=None):
    """Extend the latest visit of `session` if still inside the inactivity window, else open one.

    Extending is a single atomic `UPDATE` (`hits = hits + 1`), so concurrent requests never
    lose a hit. A session created during this request (`new_session=True`) cannot have a
    visit yet, so the lookup is skipped and a visit is opened directly.

    `path` (the request's route pattern) becomes `first_path` and `last_path` of an opened visit,
    or the new `last_path` of an extended one, inside the same statement (no extra query). `ip`
    (the request's client IP) is handled the same way through `first_ip` and `last_ip`: an IP
    change never opens or closes a visit, it only moves `last_ip`.

    A session deleted mid-request (e.g. by a statistics clear) gets no visit and no error.
    """
    now = timezone.now()
    if new_session or not _extend_latest_visit(session, now, path, ip):
        _open_visit(session, now, path, ip)


def _open_visit(session, now, path, ip):
    """Open a visit for `session`; skip silently if the session vanished mid-request.

    The savepoint keeps a caught `IntegrityError` from breaking an enclosing transaction.
    """
    try:
        with transaction.atomic():
            Visit.objects.create(
                session=session, started_at=now, last_seen_at=now, hits=1,
                first_path=path, last_path=path, first_ip=ip, last_ip=ip,
            )
    except IntegrityError:
        pass


def _extend_latest_visit(session, now, path, ip):
    """Atomically bump the latest visit of `session` if still active; return whether it did."""
    latest_pk = session.visits.order_by('-last_seen_at').values_list('pk', flat=True).first()
    if latest_pk is None:
        return False

    cutoff = now - timedelta(seconds=Settings.visit_inactivity_seconds())
    updated = Visit.objects.filter(pk=latest_pk, last_seen_at__gte=cutoff).update(
        hits=F('hits') + 1, last_seen_at=now, last_path=path, last_ip=ip,
    )
    return bool(updated)
