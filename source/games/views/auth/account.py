"""View for retrieving or updating the authenticated user's own account."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...serializers import MyAccountDetailSerializer, MyAccountUpdateSerializer
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def account(request):
    """Return or update the authenticated user's own name/email/password."""
    if request.method == 'PATCH':
        return _update_account(request)

    return Response(MyAccountDetailSerializer(request.user).data)


def _update_account(request):
    """Validate the payload, persist the update, then return the detail Response."""
    serializer = MyAccountUpdateSerializer(request.user, data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(MyAccountDetailSerializer(request.user).data)
