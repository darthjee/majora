"""Shared query filters for the game common items index views."""

from common.query_filters import filter_by_max, filter_by_min, filter_by_name

from ...models import GameCommonItem

_CATEGORIES = frozenset(value for value, _ in GameCommonItem.CATEGORY_CHOICES)


def filter_by_category(request, queryset):
    """Narrow `queryset` to common items whose category exactly matches `?category=`.

    An absent or empty value is ignored; an unknown value yields an empty queryset.
    """
    category = request.query_params.get('category')
    if not category:
        return queryset
    if category not in _CATEGORIES:
        return queryset.none()
    return queryset.filter(category=category)


def apply_common_item_filters(request, queryset):
    """Apply the `name`, `category`, `min_price` and `max_price` filters, combined with AND."""
    queryset = filter_by_name(request, queryset)
    queryset = filter_by_category(request, queryset)
    queryset = filter_by_min(request, queryset, 'min_price', 'price')
    return filter_by_max(request, queryset, 'max_price', 'price')
