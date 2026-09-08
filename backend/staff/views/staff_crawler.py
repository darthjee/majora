"""View for recording/browsing raw crawler emissions, restricted to staff/superuser.

Temporary debug harness — see `docs/agents/specs/crawler-test-harness.md`. Deliberately kept
out of the serializer layer (the model itself is temporary), so records are built/read as
plain dicts here rather than through a dedicated serializer.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..crawler_debug_emission_paginator import CrawlerDebugEmissionPaginator, enforce_retention_cap
from ..models import CrawlerDebugEmission


@restricted
@api_view(['GET', 'POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_crawler(request):
    """Record a new crawler emission (`POST`), or list recorded ones (`GET`)."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    if request.method == 'POST':
        return _create(request)
    return _list(request)


def _create(request):
    """Validate and store a new crawler debug emission, returning the created record."""
    source, emission_type, error_response = _parse_create_fields(request)
    if error_response:
        return error_response

    emission = CrawlerDebugEmission.objects.create(
        source=source, type=emission_type, payload=_parse_payload(request),
    )
    enforce_retention_cap(CrawlerDebugEmission.objects.all())
    return Response(_emission_dict(emission), status=201)


def _parse_payload(request):
    """Return the request's `payload`, defaulting to `{}` when omitted or explicitly `null`.

    `JSONField` doesn't allow `NULL` at the DB level, so an absent/`null` payload can't be
    stored as-is.
    """
    payload = request.data.get('payload')
    return payload if payload is not None else {}


def _parse_create_fields(request):
    """Return `(source, type, None)`, or `(None, None, Response)` if either is missing/blank."""
    source = request.data.get('source')
    emission_type = request.data.get('type')
    errors = {}
    if not source:
        errors['source'] = ['required']
    if not emission_type:
        errors['type'] = ['required']
    if errors:
        return None, None, Response({'errors': errors}, status=400)
    return source, emission_type, None


def _list(request):
    """List recorded emissions with `id > last_id` (or from the start), oldest-first."""
    try:
        page = CrawlerDebugEmissionPaginator(
            request, CrawlerDebugEmission.objects.all(),
        ).paginate()
    except ValueError:
        return Response({'errors': {'last_id': ['invalid_last_id']}}, status=400)
    return Response([_emission_dict(emission) for emission in page])


def _emission_dict(emission):
    """Serialize `emission` into the plain dict shape returned by this debug endpoint."""
    return {
        'id': emission.id,
        'created_at': emission.created_at,
        'source': emission.source,
        'type': emission.type,
        'payload': emission.payload,
    }
