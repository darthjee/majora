"""View renaming and revoking one of the caller's own scoped API tokens."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import ApiToken
from accounts.serializers import ApiTokenItemSerializer, ApiTokenRenameSerializer
from games.decorators import restricted
from games.views.common import validated_or_error

from ._shared import session_owner_error


@restricted
@api_view(['PATCH', 'DELETE'])
# AllowAny: authentication is enforced inline via require_session/require_authenticated so
# scoped-token or anonymous callers receive a proper 403/401.
@permission_classes([AllowAny])
def api_token(request, token_id):
    """Rename (PATCH, name only) or revoke (DELETE) one of the caller's tokens."""
    error_response = session_owner_error(request)
    if error_response:
        return error_response
    token = get_object_or_404(ApiToken, pk=token_id, owner=request.user)
    if request.method == 'DELETE':
        token.delete()
        return Response(status=204)
    return _rename(request, token)


def _rename(request, token):
    """Validate the new name, save it and return the updated token item."""
    serializer = ApiTokenRenameSerializer(token, data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response
    serializer.save()
    return Response(ApiTokenItemSerializer(token).data)
