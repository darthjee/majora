"""View for listing all treasures or creating a new one."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Treasure
from ...serializers import (
    TreasureCreateSerializer,
    TreasureDetailSerializer,
    TreasureListSerializer,
)
from ..common import paginated_list_response, require_authenticated, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authentication is enforced
# inline inside _create_treasure so unauthenticated callers receive a proper 401.
@permission_classes([AllowAny])
def treasures_list(request):
    """Return a list of all treasures or create a new treasure."""
    if request.method == 'POST':
        return _create_treasure(request)

    treasures = Treasure.objects.filter(game__isnull=True)
    return paginated_list_response(request, treasures, TreasureListSerializer)


def _create_treasure(request):
    """Validate request and create a new treasure, returning 201 with detail data."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    if not request.user.is_superuser:
        return Response({'errors': {'detail': ['not allowed']}}, status=403)

    serializer = TreasureCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    treasure = serializer.save()
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)
