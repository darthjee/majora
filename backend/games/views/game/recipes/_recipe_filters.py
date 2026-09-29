"""Shared query filters for the game recipe index views."""

from ....models import GameCommonItem

_CATEGORIES = frozenset(value for value, _ in GameCommonItem.CATEGORY_CHOICES)


def filter_by_category(request, queryset, mask_hidden_output):
    """Narrow `queryset` to recipes whose output item matches the `?category=` param.

    An unknown category yields an empty queryset. When `mask_hidden_output` is true, recipes
    whose output item is hidden never match, so the filter cannot leak a hidden item's category.
    """
    category = request.query_params.get('category')
    if category is None:
        return queryset
    if category not in _CATEGORIES:
        return queryset.none()
    queryset = queryset.filter(game_common_item__category=category)
    if mask_hidden_output:
        return queryset.filter(game_common_item__hidden=False)
    return queryset
