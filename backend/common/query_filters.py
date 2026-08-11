"""Shared, cross-app queryset filters driven by request query params."""


def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    name = request.query_params.get('name')
    if not name:
        return queryset
    return queryset.filter(**{f'{field}__icontains': name})
