"""Shared, cross-app queryset filters driven by request query params.

Holds the `name` substring filter and the generic int-range helpers (`filter_by_min` /
`filter_by_max`) used by the treasure and common items indexes.
"""


def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    name = request.query_params.get('name')
    if not name:
        return queryset
    return queryset.filter(**{f'{field}__icontains': name})


def filter_by_min(request, queryset, param, field):
    """Filter `queryset` to `<field>__gte` an optional integer query param `param`."""
    return _filter_by_int(request, queryset, param, f'{field}__gte')


def filter_by_max(request, queryset, param, field):
    """Filter `queryset` to `<field>__lte` an optional integer query param `param`."""
    return _filter_by_int(request, queryset, param, f'{field}__lte')


def _filter_by_int(request, queryset, param, lookup):
    """Apply `lookup` with the int value of `param`; ignore absent or non-int values."""
    value = request.query_params.get(param)
    if value is None:
        return queryset

    try:
        value = int(value)
    except ValueError:
        return queryset

    return queryset.filter(**{lookup: value})
