"""Query-param filter helpers for game/character-scoped treasure list views.

Thin wrappers binding the treasure param names (`min_value` / `max_value`) to the shared
helpers in `common/query_filters.py`, the canonical home of the int-range and name filters.
"""

from common.query_filters import filter_by_max, filter_by_min
from common.query_filters import filter_by_name as _common_filter_by_name


def filter_by_min_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__gte` an optional `min_value` query param."""
    return filter_by_min(request, queryset, 'min_value', field)


def filter_by_max_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__lte` an optional `max_value` query param."""
    return filter_by_max(request, queryset, 'max_value', field)


def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    return _common_filter_by_name(request, queryset, field=field)
