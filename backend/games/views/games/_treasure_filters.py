"""Shared query-param filter helpers for game/character-scoped treasure list views."""


def _filter_by_value(request, queryset, param, lookup, field):
    """Filter `queryset` to `<field>__<lookup>` an optional integer query param `param`."""
    value = request.GET.get(param)
    if value is None:
        return queryset

    try:
        value = int(value)
    except ValueError:
        return queryset

    return queryset.filter(**{f'{field}__{lookup}': value})


def filter_by_min_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__gte` an optional `min_value` query param."""
    return _filter_by_value(request, queryset, 'min_value', 'gte', field)


def filter_by_max_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__lte` an optional `max_value` query param."""
    return _filter_by_value(request, queryset, 'max_value', 'lte', field)


def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    name = request.GET.get('name')
    if not name:
        return queryset

    return queryset.filter(**{f'{field}__icontains': name})
