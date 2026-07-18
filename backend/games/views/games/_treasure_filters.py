"""Shared query-param filter helpers for game/character-scoped treasure list views."""


def filter_by_min_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__gte` an optional `min_value` query param."""
    min_value = request.GET.get('min_value')
    if min_value is None:
        return queryset

    try:
        min_value = int(min_value)
    except ValueError:
        return queryset

    return queryset.filter(**{f'{field}__gte': min_value})


def filter_by_max_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__lte` an optional `max_value` query param."""
    max_value = request.GET.get('max_value')
    if max_value is None:
        return queryset

    try:
        max_value = int(max_value)
    except ValueError:
        return queryset

    return queryset.filter(**{f'{field}__lte': max_value})


def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    name = request.GET.get('name')
    if not name:
        return queryset

    return queryset.filter(**{f'{field}__icontains': name})
