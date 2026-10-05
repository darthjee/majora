"""The logged-in users ranking of the staff access statistics."""

from . import metrics
from .filters import StatisticsFilters
from .visit_query import VisitQuery

_USER_ID = 0
_DOMAIN_ID = 1
_HOSTNAME = 2
_STARTED_AT = 3
_LAST_SEEN_AT = 4
_HITS = 5


class UsersRanking:
    """Ranks the logged-in users of the filtered range by a visit metric, descending."""

    SORT_KEYS = {
        'visits': 'visits',
        'time_on_site': 'time_on_site_seconds',
        'average_duration': 'average_duration_seconds',
        'hits': 'hits',
        'last_seen': 'last_seen_at',
    }
    DEFAULT_SORT = 'visits'

    def __init__(self, filters, sort=DEFAULT_SORT):
        """Store the resolved filters and the (already validated) sort key."""
        self._filters = filters
        self._sort = sort

    def build(self):
        """Return the sorted per-user metric rows (without identities) from one visit query."""
        summaries = [_UserSummary(user_id, rows) for user_id, rows in self._grouped().items()]
        return _RankedRows([summary.as_dict() for summary in self._sorted(summaries)])

    def _rows(self):
        """Return the logged-in visit rows matching the filters."""
        return VisitQuery(self._filters).queryset().filter(
            session__user__isnull=False,
        ).values_list(
            'session__user_id', 'session__domain_id', 'session__domain__domain',
            'started_at', 'last_seen_at', 'hits',
        )

    def _grouped(self):
        """Return the visit rows grouped by user id."""
        groups = {}
        for row in self._rows():
            groups.setdefault(row[_USER_ID], []).append(row)
        return groups

    def _sorted(self, summaries):
        """Return `summaries` descending on the sort field, ties broken by user id ascending."""
        field = self.SORT_KEYS[self._sort]
        by_id = sorted(summaries, key=lambda summary: summary.user_id)
        return sorted(by_id, key=lambda summary: summary.value(field), reverse=True)


class _UserSummary:
    """Reduces the visit rows of one user into the ranking metrics."""

    UNKNOWN_DOMAIN = {'id': StatisticsFilters.UNKNOWN_DOMAIN, 'domain': None}

    def __init__(self, user_id, rows):
        """Reduce `rows` (all belonging to `user_id`) into the metrics."""
        self.user_id = user_id
        self._values = self._reduce(rows)
        self._domains = self._domain_entries(rows)

    def value(self, field):
        """Return the raw value of `field` (the `last_seen_at` datetime, not its string)."""
        return self._values[field]

    def as_dict(self):
        """Return the serialized row: id, metrics, domains and the ISO `last_seen_at`."""
        return {
            'id': self.user_id,
            **self._values,
            'domains': self._domains,
            'last_seen_at': metrics.iso_utc(self._values['last_seen_at']),
        }

    @classmethod
    def _reduce(cls, rows):
        """Return the metric values of `rows`, keeping `last_seen_at` as a datetime."""
        durations = cls._durations(rows)
        return {
            'visits': metrics.count(rows),
            'time_on_site_seconds': sum(durations),
            'average_duration_seconds': round(metrics.average(durations)),
            'hits': sum(row[_HITS] for row in rows),
            'last_seen_at': max(row[_LAST_SEEN_AT] for row in rows),
        }

    @staticmethod
    def _durations(rows):
        """Return the whole-second duration of every row."""
        return [metrics.duration_seconds(row[_STARTED_AT], row[_LAST_SEEN_AT]) for row in rows]

    @classmethod
    def _domain_entries(cls, rows):
        """Return the distinct domains by hostname, with the unknown entry last when present."""
        entries = cls._known_domains(rows)
        if cls._has_unknown_domain(rows):
            entries.append(dict(cls.UNKNOWN_DOMAIN))
        return entries

    @staticmethod
    def _known_domains(rows):
        """Return one `{id, domain}` entry per distinct known domain, by hostname then id."""
        known = {row[_DOMAIN_ID]: row[_HOSTNAME] for row in rows if row[_DOMAIN_ID] is not None}
        ordered = sorted(known.items(), key=lambda item: (item[1], item[0]))
        return [{'id': domain_id, 'domain': hostname} for domain_id, hostname in ordered]

    @staticmethod
    def _has_unknown_domain(rows):
        """Return whether any row's session has no domain."""
        return any(row[_DOMAIN_ID] is None for row in rows)


class _RankedRows:
    """A read-only sequence of ranked rows with the no-arg `count()` the `Paginator` expects."""

    def __init__(self, rows):
        """Store the sorted rows."""
        self._rows = rows

    def count(self):
        """Return the number of rows."""
        return len(self._rows)

    def __len__(self):
        """Return the number of rows."""
        return len(self._rows)

    def __getitem__(self, index):
        """Return a row, or a list of rows for a slice."""
        return self._rows[index]

    def __iter__(self):
        """Iterate over the rows."""
        return iter(self._rows)
