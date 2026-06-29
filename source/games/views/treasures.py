"""Views for treasure-level endpoints."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..authentication import CookieTokenAuthentication
from ..models import Treasure
from ..paginator import Paginator
from ..permissions import TreasureEditPermission
from ..serializers import (
    TreasureAccessSerializer,
    TreasureCreateSerializer,
    TreasureDetailSerializer,
    TreasureListSerializer,
    TreasureUpdateSerializer,
)


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authentication is enforced
# inline inside _create_treasure so unauthenticated callers receive a proper 401.
@permission_classes([AllowAny])
def treasures_list(request):
    """Return a list of all treasures or create a new treasure."""
    if request.method == 'POST':
        return _create_treasure(request)

    page_treasures, headers = Paginator(request, Treasure.objects.all()).paginate()
    serializer = TreasureListSerializer(page_treasures, many=True)
    return Response(serializer.data, headers=headers)


def _create_treasure(request):
    """Validate request and create a new treasure, returning 201 with detail data."""
    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)

    if not request.user.is_superuser:
        return Response({'errors': {'detail': ['not allowed']}}, status=403)

    serializer = TreasureCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    treasure = serializer.save()
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def treasure_detail(request, treasure_id):
    """Return or update detail for a specific treasure identified by treasure_id."""
    try:
        treasure = Treasure.objects.get(pk=treasure_id)
    except Treasure.DoesNotExist:
        return Response({'errors': {'detail': ['not found']}}, status=404)

    if request.method == 'PATCH':
        return _update_treasure(request, treasure)

    serializer = TreasureDetailSerializer(treasure)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def treasure_access(request, treasure_id):
    """Return whether the requesting user may edit a specific treasure."""
    treasure = Treasure.objects.filter(pk=treasure_id).first()
    serializer = TreasureAccessSerializer(treasure, context={'request': request})
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response


def _update_treasure(request, treasure):
    """Validate permissions and payload, then persist updates to a treasure."""
    error_response = TreasureEditPermission.check(request, treasure)
    if error_response:
        return error_response

    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data)
