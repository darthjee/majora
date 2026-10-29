"""The raw session export of the staff access statistics: sessions created in the range."""

from statistics.models import Session

from .filters import StatisticsFilters


class SessionExport:
    """Builds the ordered queryset of the sessions created inside the filtered range.

    Only the date range and the `domain` filter apply; the order is fixed on indexed columns
    (`created_at`, then `id`) so pages stay stable.
    """

    ORDERING = ('created_at', 'id')

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def queryset(self):
        """Return the sessions created in `[start_utc, end_utc)` matching the domain filter."""
        return Session.objects.filter(
            created_at__gte=self._filters.start_utc,
            created_at__lt=self._filters.end_utc,
            **self._domain_lookup(),
        ).select_related('domain').order_by(*self.ORDERING)

    def _domain_lookup(self):
        """Return the `domain` filter lookup: an id, `unknown` (no domain) or none."""
        domain = self._filters.domain
        if domain is None:
            return {}
        if domain == StatisticsFilters.UNKNOWN_DOMAIN:
            return {'domain__isnull': True}
        return {'domain_id': domain}
