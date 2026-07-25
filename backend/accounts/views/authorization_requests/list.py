"""View for listing the authenticated user's own authorization requests."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import AuthorizationRequest
from accounts.serializers import AuthorizationRequestListSerializer
from games.paginator import Paginator

from ._shared import expire_if_lazily_expired, skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def authorization_requests_list(request):
    """Return a paginated, newest-first list of the caller's own authorization requests.

    Lazily expires each row on the returned page before serializing (matching the
    `authorize`/`deny`/`poll` endpoints) so an expired-but-not-yet-flagged request is never
    reported as `open`/`approved` here -- only the current page is touched, keeping the
    write cost bounded regardless of how many requests the caller has overall.
    """
    queryset = AuthorizationRequest.objects.filter(user=request.user)
    page, headers = Paginator(request, queryset).paginate()
    _expire_lazily_expired_rows(page)
    serializer = AuthorizationRequestListSerializer(page, many=True)
    return skip_cache(Response(serializer.data, headers=headers))


def _expire_lazily_expired_rows(page):
    """Persist the `expired` status for each lazily-expired row in `page`, in place."""
    for authorization_request in page:
        expire_if_lazily_expired(authorization_request)
