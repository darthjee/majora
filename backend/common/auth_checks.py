"""Shared, cross-app "authentication required" response helper."""

from rest_framework.response import Response

UNAUTHENTICATED_RESPONSE_DATA = {'errors': {'detail': ['authentication_required']}}


def unauthenticated_response(request):
    """Return a 401 Response if `request.user` is missing/unauthenticated, else None."""
    if not request.user or not request.user.is_authenticated:
        return Response(UNAUTHENTICATED_RESPONSE_DATA, status=401)
    return None
