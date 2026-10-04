"""The `Visit` query matching a set of statistics filters."""

from statistics.models import Visit

from .filters import StatisticsFilters


class VisitQuery:
    """Builds the ORM query of the visits started inside the filtered range and sessions."""

    AUDIENCE_LOOKUPS = {
        'all': {},
        'anonymous': {'session__user__isnull': True},
        'logged_in': {'session__user__isnull': False},
    }

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def queryset(self):
        """Return the visits started in `[start_utc, end_utc)` matching the session filters."""
        return Visit.objects.filter(
            started_at__gte=self._filters.start_utc,
            started_at__lt=self._filters.end_utc,
            **self._session_lookups(),
        )

    def rows(self, *fields):
        """Return only `fields` of the matching visits, as tuples."""
        return self.queryset().values_list(*fields)

    @staticmethod
    def visitor_key(user_id, session_id):
        """Return the visitor identity: the user when logged in, else the session."""
        if user_id is not None:
            return ('user', user_id)
        return ('session', session_id)

    def _session_lookups(self):
        """Return the combined user, domain and audience lookups."""
        return {
            **self._user_lookup(),
            **self._domain_lookup(),
            **self.AUDIENCE_LOOKUPS[self._filters.audience],
        }

    def _user_lookup(self):
        """Return the `user` filter lookup, if any."""
        if self._filters.user_id is None:
            return {}
        return {'session__user_id': self._filters.user_id}

    def _domain_lookup(self):
        """Return the `domain` filter lookup: an id, `unknown` (no domain) or none."""
        domain = self._filters.domain
        if domain is None:
            return {}
        if domain == StatisticsFilters.UNKNOWN_DOMAIN:
            return {'session__domain__isnull': True}
        return {'session__domain_id': domain}
