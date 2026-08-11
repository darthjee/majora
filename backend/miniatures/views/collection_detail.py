"""View for retrieving a single collection's detail."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Collection
from ..serializers import CollectionDetailSerializer
from ._shared import NOT_FOUND_RESPONSE_DATA, skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def collection_detail(request, collection_id):
    """Return detail for a specific collection identified by collection_id."""
    try:
        collection = Collection.objects.get(pk=collection_id)
    except Collection.DoesNotExist:
        return skip_cache(Response(NOT_FOUND_RESPONSE_DATA, status=404))

    serializer = CollectionDetailSerializer(collection)
    return skip_cache(Response(serializer.data))
