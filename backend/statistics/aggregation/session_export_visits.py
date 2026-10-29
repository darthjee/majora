"""The visits of a page of exported sessions, loaded in one capped batch."""

from django.db.models import F, Window
from django.db.models.functions import RowNumber

from statistics.models import Visit


class SessionExportVisits:
    """Loads, in one query, the in-range visits of a page of sessions, capped per session.

    Each session keeps at most `MAX_PER_SESSION` visits (earliest first); one extra row per
    session is read so a cut-off list can be flagged as truncated.
    """

    MAX_PER_SESSION = 100

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def by_session(self, sessions):
        """Return `{session_id: [visit, ...]}` for `sessions`, each list up to the cap + 1."""
        ids = [session.id for session in sessions]
        if not ids:
            return {}
        grouped = {}
        for visit in self._queryset(ids):
            grouped.setdefault(visit.session_id, []).append(visit)
        return grouped

    def _queryset(self, ids):
        """Return the ranked in-range visits of the sessions `ids`, at most cap + 1 each."""
        return self._ranked(ids).filter(
            session_rank__lte=self.MAX_PER_SESSION + 1,
        ).order_by('session_id', 'started_at', 'id')

    def _ranked(self, ids):
        """Return the in-range visits of `ids`, annotated with their rank inside the session."""
        return Visit.objects.filter(
            session_id__in=ids,
            started_at__gte=self._filters.start_utc,
            started_at__lt=self._filters.end_utc,
        ).annotate(session_rank=Window(
            expression=RowNumber(),
            partition_by=[F('session_id')],
            order_by=[F('started_at').asc(), F('id').asc()],
        ))
