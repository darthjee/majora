"""View for retrieving or updating a single treasure's detail."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Treasure
from ...permissions import TreasureEditPermission
from ...serializers import TreasureDetailSerializer, TreasureUpdateSerializer
from ..common import detail_or_update


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authentication/authorisation is
# enforced inline in detail_or_update via TreasureEditPermission.check().
@permission_classes([AllowAny])
def treasure_detail(request, treasure_id):
    """Return or update detail for a specific treasure identified by treasure_id."""
    try:
        treasure = Treasure.objects.get(pk=treasure_id)
    except Treasure.DoesNotExist:
        return Response({'errors': {'detail': ['not found']}}, status=404)

    return detail_or_update(
        request, treasure, TreasureEditPermission, TreasureUpdateSerializer,
        TreasureDetailSerializer,
    )
