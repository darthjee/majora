"""Shared helpers for the staff access statistics views (filter parsing, response envelope)."""

from rest_framework.response import Response

from statistics.aggregation import StatisticsParamsParser


def parse_statistics_filters(request):
    """Return `(filters, None)`, or `(None, 400 Response)` listing every invalid param."""
    filters, errors = StatisticsParamsParser(request.query_params).parse()
    if errors:
        return None, Response({'errors': errors}, status=400)
    return filters, None


def statistics_envelope(filters, buckets=None, totals=None, **extra):
    """Return the `{filters, buckets, totals, ...}` envelope; `None` buckets/totals are omitted."""
    envelope = {'filters': filters.as_dict()}
    if buckets is not None:
        envelope['buckets'] = buckets
    if totals is not None:
        envelope['totals'] = totals
    envelope.update(extra)
    return envelope
