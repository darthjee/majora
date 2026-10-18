"""View listing and creating the caller's own scoped API tokens."""

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.serializers import ApiTokenCreateSerializer, ApiTokenItemSerializer
from games.decorators import restricted
from games.views.common import validated_or_error

from ._shared import session_owner_error


@restricted
@api_view(['GET', 'POST'])
@parser_classes([JSONParser])
# AllowAny: authentication is enforced inline via require_session/require_authenticated so
# scoped-token or anonymous callers receive a proper 403/401.
@permission_classes([AllowAny])
def api_tokens(request):
    """List the caller's tokens (GET), or create one and return its full value once (POST)."""
    error_response = session_owner_error(request)
    if error_response:
        return error_response
    if request.method == 'POST':
        return _create(request)
    return _list(request)


def _list(request):
    """Return the caller's tokens, newest first, as a plain array."""
    tokens = (
        request.user.api_tokens.prefetch_related('games').order_by('-created_at', '-pk')
    )
    return Response(ApiTokenItemSerializer(tokens, many=True).data)


def _create(request):
    """Validate the payload, create the token for the caller and return 201."""
    serializer = ApiTokenCreateSerializer(data=request.data, context={'user': request.user})
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response
    serializer.save()
    return Response(serializer.created_data(), status=201)
