"""The visit list of the staff access statistics: one row per matched visit."""

from django.db.models import DurationField, ExpressionWrapper, F

from .visit_query import VisitQuery


class VisitList:
    """Builds the lazy, database-ordered queryset of the visits matching the filters."""

    SORT_KEYS = {
        'started_at': 'started_at',
        'last_seen': 'last_seen_at',
        'duration': 'duration',
        'hits': 'hits',
    }
    DEFAULT_SORT = 'started_at'

    def __init__(self, filters, sort=DEFAULT_SORT):
        """Store the resolved filters and the (already validated) sort key."""
        self._filters = filters
        self._sort = sort

    def queryset(self):
        """Return the matching visits, descending on the sort field, ties by id descending."""
        return self._base_queryset().annotate(
            duration=self._duration(),
        ).order_by(f'-{self.SORT_KEYS[self._sort]}', '-id')

    def _base_queryset(self):
        """Return the filtered visits with their session, user, profile and domain joined."""
        return VisitQuery(self._filters).queryset().select_related(
            'session__user__profile', 'session__domain',
        )

    @staticmethod
    def _duration():
        """Return the `last_seen_at - started_at` duration expression."""
        return ExpressionWrapper(
            F('last_seen_at') - F('started_at'), output_field=DurationField(),
        )
