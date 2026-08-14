"""Shared query-param filter helpers for the STL model list view."""

from common.query_filters import filter_by_name as _common_filter_by_name

from ..models import StlModel


def filter_by_name(request, queryset):
    """Filter `queryset` to a case-insensitive substring match on `name`."""
    return _common_filter_by_name(request, queryset)


def filter_by_type(request, queryset):
    """Filter `queryset` to an exact `type` match when it is a recognized choice."""
    return _filter_by_choice(request, queryset, param='type', choices=StlModel.TYPE_CHOICES)


def filter_by_size(request, queryset):
    """Filter `queryset` to an exact `size` match when it is a recognized choice."""
    return _filter_by_choice(request, queryset, param='size', choices=StlModel.SIZE_CHOICES)


def filter_by_race(request, queryset):
    """Filter `queryset` to STL models whose races include any of the given `race` values."""
    values = _filter_by_choice_list(
        request.query_params.getlist('race'), choices=StlModel.RACE_CHOICES,
    )
    if not values:
        return queryset
    return queryset.filter(races__creature__in=values)


def filter_by_roles(request, queryset):
    """Filter `queryset` to STL models whose roles include any of the given `roles` values."""
    values = _filter_by_choice_list(
        request.query_params.getlist('roles'), choices=StlModel.ROLE_CHOICES,
    )
    if not values:
        return queryset
    return queryset.filter(roles__role__in=values)


def filter_by_source(request, queryset):
    """Filter `queryset` to STL models linked to any of the given `source` ids."""
    values = _parse_ints(request.query_params.getlist('source'))
    if not values:
        return queryset
    return queryset.filter(sources__id__in=values)


def filter_by_collection(request, queryset):
    """Filter `queryset` to STL models linked to any of the given `collection` ids."""
    values = _parse_ints(request.query_params.getlist('collection'))
    if not values:
        return queryset
    return queryset.filter(collections__id__in=values)


def filter_by_tags(request, queryset):
    """Filter `queryset` to STL models tagged with any of the given `tags` names."""
    values = request.query_params.getlist('tags')
    if not values:
        return queryset
    return queryset.filter(tags__name__in=values)


def _filter_by_choice(request, queryset, param, choices):
    """Filter `queryset` to an exact `<field>=<value>` match when `value` is a valid choice."""
    value = request.query_params.get(param)
    valid_values = {key for key, _label in choices}
    if value not in valid_values:
        return queryset
    return queryset.filter(**{param: value})


def _filter_by_choice_list(values, choices):
    """Return the subset of `values` that are valid members of `choices`, ignoring the rest."""
    valid_values = {key for key, _label in choices}
    return [value for value in values if value in valid_values]


def _parse_ints(values):
    """Return the subset of `values` that parse as integers, ignoring non-numeric entries."""
    parsed = []
    for value in values:
        try:
            parsed.append(int(value))
        except ValueError:
            continue
    return parsed
