"""Shared helpers for the staff access statistics views (filter parsing, response envelope)."""

from rest_framework.response import Response

from statistics.aggregation import StatisticsParamsParser


def parse_statistics_filters(request, extra_errors=None):
    """Return `(filters, None)`, or `(None, 400 Response)` listing every invalid param.

    `extra_errors` (e.g. a tab-specific `sort` error) are merged into the shared parser's errors,
    so every invalid param is reported at once.
    """
    filters, errors = StatisticsParamsParser(request.query_params).parse()
    errors = {**errors, **(extra_errors or {})}
    if errors:
        return None, Response({'errors': errors}, status=400)
    return filters, None


def parse_sort(request, choices, default):
    """Return `(sort, errors)`: an omitted `sort` is `default`, an empty or unknown one invalid."""
    sort = request.query_params.get('sort', default)
    if sort not in choices:
        return None, {'sort': ['invalid_sort']}
    return sort, {}


def statistics_envelope(filters, buckets=None, totals=None, **extra):
    """Return the `{filters, buckets, totals, ...}` envelope; `None` buckets/totals are omitted."""
    envelope = {'filters': filters.as_dict()}
    if buckets is not None:
        envelope['buckets'] = buckets
    if totals is not None:
        envelope['totals'] = totals
    envelope.update(extra)
    return envelope
