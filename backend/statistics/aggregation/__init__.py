"""On-the-fly aggregation of `Visit` rows for the staff access statistics endpoints.

Plain classes, one per file: request filter parsing and validation, granularity resolution,
time-zone-aware bucketing, the visit query, zero-filled series and pure metric helpers.
Never `import statistics` for the stdlib helpers: this app's name shadows that module.
"""

from .filters import StatisticsFilters
from .granularity import Granularity
from .params_parser import StatisticsParamsParser

__all__ = [
    'Granularity',
    'StatisticsFilters',
    'StatisticsParamsParser',
]
