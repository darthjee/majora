"""The per-domain summary of the staff access statistics."""

from domains.models import Domain

from . import metrics
from .filters import StatisticsFilters
from .visit_query import VisitQuery

_DOMAIN_ID = 0
_SESSION_ID = 1
_USER_ID = 2
_STARTED_AT = 3
_LAST_SEEN_AT = 4


class DomainsSummary:
    """Aggregates the visits of the filtered range per configured domain, plus `unknown`."""

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def build(self):
        """Return `(domains, totals)` computed from a single visit query and a domain query."""
        rows = list(VisitQuery(self._filters).rows(
            'session__domain_id', 'session_id', 'session__user_id', 'started_at', 'last_seen_at',
        ))
        grouped = self._grouped(rows)
        domains = self._sorted(self._known_rows(grouped)) + self._unknown_rows(grouped)
        return domains, _VisitMetrics(rows).as_dict()

    @staticmethod
    def _grouped(rows):
        """Return the visit rows grouped by domain id (`None` for the unknown domain)."""
        groups = {}
        for row in rows:
            groups.setdefault(row[_DOMAIN_ID], []).append(row)
        return groups

    def _known_rows(self, grouped):
        """Return one zero-filled summary row per selected configured domain."""
        return [
            _DomainRow.known(domain, grouped.get(domain.id, [])).as_dict()
            for domain in self._domains()
        ]

    def _unknown_rows(self, grouped):
        """Return the unknown row when the domain filter is unset or `unknown`, else nothing."""
        if self._filters.domain not in (None, StatisticsFilters.UNKNOWN_DOMAIN):
            return []
        return [_DomainRow.unknown(grouped.get(None, [])).as_dict()]

    def _domains(self):
        """Return the configured domains selected by the domain filter (no query for unknown)."""
        domain = self._filters.domain
        if domain == StatisticsFilters.UNKNOWN_DOMAIN:
            return []
        queryset = Domain.objects.select_related('domain_group')
        if domain is None:
            return queryset
        return queryset.filter(id=domain)

    @staticmethod
    def _sorted(rows):
        """Return `rows` by visits descending, then hostname ascending."""
        return sorted(rows, key=lambda row: (-row['visits'], row['domain']))


class _DomainRow:
    """One serialized summary row: the domain identity plus the metrics of its visits."""

    def __init__(self, identity, rows):
        """Store the `{id, domain, group}` identity and the domain's visit rows."""
        self._identity = identity
        self._rows = rows

    @classmethod
    def known(cls, domain, rows):
        """Return the row of a configured `Domain`."""
        return cls(
            {'id': domain.id, 'domain': domain.domain, 'group': domain.domain_group.name}, rows,
        )

    @classmethod
    def unknown(cls, rows):
        """Return the row of the visits without a domain."""
        return cls({'id': StatisticsFilters.UNKNOWN_DOMAIN, 'domain': None, 'group': None}, rows)

    def as_dict(self):
        """Return the identity merged with the six metrics."""
        return {**self._identity, **_VisitMetrics(self._rows).as_dict()}


class _VisitMetrics:
    """Reduces visit rows into the six summary metrics (`0` / `None` when empty)."""

    def __init__(self, rows):
        """Store the visit rows."""
        self._rows = rows

    def as_dict(self):
        """Return the visits, audience split, unique visitors and duration metrics."""
        durations = self._durations()
        return {
            'visits': metrics.count(self._rows),
            'anonymous': metrics.count(self._user_rows(logged_in=False)),
            'logged_in': metrics.count(self._user_rows(logged_in=True)),
            'unique_visitors': metrics.unique(self._visitor_keys()),
            'average_duration_seconds': self._rounded(metrics.average(durations)),
            'median_duration_seconds': self._rounded(metrics.median(durations)),
        }

    def _user_rows(self, logged_in):
        """Return the rows whose session is logged in (or anonymous)."""
        return [row for row in self._rows if (row[_USER_ID] is not None) == logged_in]

    def _visitor_keys(self):
        """Return the visitor key of every row."""
        return [VisitQuery.visitor_key(row[_USER_ID], row[_SESSION_ID]) for row in self._rows]

    def _durations(self):
        """Return the whole-second duration of every row."""
        return [
            metrics.duration_seconds(row[_STARTED_AT], row[_LAST_SEEN_AT]) for row in self._rows
        ]

    @staticmethod
    def _rounded(value):
        """Return `value` rounded to an int, keeping `None` as is."""
        return None if value is None else round(value)
