"""View for listing the authenticated user's own authorization requests."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.models import AuthorizationRequest
from accounts.serializers import AuthorizationRequestListSerializer
from games.views.common import paginated_list_response

from ._shared import skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def authorization_requests_list(request):
    """Return a paginated, newest-first list of the caller's own authorization requests."""
    queryset = AuthorizationRequest.objects.filter(user=request.user)
    response = paginated_list_response(request, queryset, AuthorizationRequestListSerializer)
    return skip_cache(response)
