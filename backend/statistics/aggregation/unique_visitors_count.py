"""The unique-visitors count of the staff statistics summary, as one SQL aggregate."""

from django.db.models import Count, Q

from .visit_query import VisitQuery


class UniqueVisitorsCount:
    """Counts the unique visitors of the visits started in the filtered range, in SQL.

    Logged-in visitors are keyed by user and anonymous ones by session, like
    `VisitQuery.visitor_key`; the two are counted separately, so ids never collide.
    """

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def count(self):
        """Return the number of unique visitors (one aggregate query, no rows loaded)."""
        totals = VisitQuery(self._filters).queryset().aggregate(
            users=Count('session__user_id', distinct=True),
            anonymous=Count(
                'session_id', distinct=True, filter=Q(session__user_id__isnull=True),
            ),
        )
        return totals['users'] + totals['anonymous']
