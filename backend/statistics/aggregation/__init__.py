"""On-the-fly aggregation of `Visit` rows for the staff access statistics endpoints.

Plain classes, one per file: request filter parsing and validation, granularity resolution,
time-zone-aware bucketing, the visit query, zero-filled series, pure metric helpers and the
per-endpoint aggregations built on top of them (e.g. `VisitsSeries`, `OverviewTotals`).
Never `import statistics` for the stdlib helpers: this app's name shadows that module.
"""

from . import metrics
from .bucket import Bucket
from .bucket_calendar import BucketCalendar
from .filters import StatisticsFilters
from .granularity import Granularity
from .overview_totals import OverviewTotals
from .params_parser import StatisticsParamsParser
from .series import Series
from .visit_query import VisitQuery
from .visits_series import VisitsSeries

__all__ = [
    'Bucket',
    'BucketCalendar',
    'Granularity',
    'OverviewTotals',
    'Series',
    'StatisticsFilters',
    'StatisticsParamsParser',
    'VisitQuery',
    'VisitsSeries',
    'metrics',
]
