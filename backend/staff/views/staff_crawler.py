"""View for recording/browsing raw crawler emissions, restricted to staff/superuser.

Temporary debug harness — see `docs/agents/specs/crawler-test-harness.md`. Deliberately kept
out of the serializer layer (the model itself is temporary), so records are built/read as
plain dicts here rather than through a dedicated serializer.
"""

import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..crawler_debug_emission_paginator import CrawlerDebugEmissionPaginator, enforce_retention_cap
from ..models import CrawlerDebugEmission
from .staff_crawler_clear import clear_crawler_emissions

#: Matches `CrawlerDebugEmission.source`/`type` `CharField(max_length=100)`.
MAX_FIELD_LENGTH = 100

#: Cap on the serialized size of `payload`, to keep this temporary debug harness's storage
#: (bounded to `RETENTION_CAP` rows) from ballooning towards DRF's much larger per-request
#: `DATA_UPLOAD_MAX_MEMORY_SIZE`, and to avoid deeply nested payloads risking recursion limits.
MAX_PAYLOAD_BYTES = 64 * 1024


@restricted
@api_view(['GET', 'POST', 'DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_crawler(request):
    """Record an emission (`POST`), list recorded ones (`GET`), or clear them all (`DELETE`)."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    if request.method == 'POST':
        return _create(request)
    if request.method == 'DELETE':
        clear_crawler_emissions()
        return Response(status=204)
    return _list(request)


def _create(request):
    """Validate and store a new crawler debug emission, returning the created record."""
    source, emission_type, error_response = _parse_create_fields(request)
    if error_response:
        return error_response

    payload, error_response = _parse_payload(request)
    if error_response:
        return error_response

    emission = CrawlerDebugEmission.objects.create(
        source=source, type=emission_type, payload=payload,
    )
    enforce_retention_cap(CrawlerDebugEmission.objects.all())
    return Response(_emission_dict(emission), status=201)


def _parse_payload(request):
    """Return `(payload, None)`, or `(None, Response)` if `payload` exceeds `MAX_PAYLOAD_BYTES`.

    Defaults to `{}` when omitted or explicitly `null`, since `JSONField` doesn't allow `NULL`
    at the DB level, so an absent/`null` payload can't be stored as-is.
    """
    payload = request.data.get('payload')
    if payload is None:
        return {}, None
    if len(json.dumps(payload)) > MAX_PAYLOAD_BYTES:
        return None, Response({'errors': {'payload': ['too_large']}}, status=400)
    return payload, None


def _parse_create_fields(request):
    """Return `(source, type, None)`, or `(None, None, Response)` if either field is invalid."""
    source = request.data.get('source')
    emission_type = request.data.get('type')
    errors = {}
    errors.update(_field_errors('source', source))
    errors.update(_field_errors('type', emission_type))
    if errors:
        return None, None, Response({'errors': errors}, status=400)
    return source, emission_type, None


def _field_errors(field_name, value):
    """Return `{field_name: [...]}` if `value` is missing/blank, not a `str`, or too long."""
    if not value:
        return {field_name: ['required']}
    if not isinstance(value, str):
        return {field_name: ['invalid']}
    if len(value) > MAX_FIELD_LENGTH:
        return {field_name: ['too_long']}
    return {}


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
