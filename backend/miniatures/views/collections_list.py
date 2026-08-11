"""View for listing collections or creating a new one."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.paginator import Paginator
from games.views.common import require_staff, validated_or_error

from ..models import Collection
from ..serializers import (
    CollectionCreateSerializer,
    CollectionDetailSerializer,
    CollectionListSerializer,
)
from ._shared import skip_cache


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def collections_list(request):
    """Return a paginated list of collections, or create a new one."""
    if request.method == 'POST':
        return _create_collection(request)

    page, headers = Paginator(request, Collection.objects.all()).paginate()
    serializer = CollectionListSerializer(page, many=True)
    return skip_cache(Response(serializer.data, headers=headers))


def _create_collection(request):
    """Validate the request, create a new collection, and return 201 with detail data."""
    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    serializer = CollectionCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return skip_cache(error_response)

    collection = serializer.save()
    detail = CollectionDetailSerializer(collection)
    return skip_cache(Response(detail.data, status=201))
