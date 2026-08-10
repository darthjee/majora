"""View for retrieving a single source's detail."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Source
from ..serializers import SourceDetailSerializer
from ._shared import NOT_FOUND_RESPONSE_DATA, skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def source_detail(request, source_id):
    """Return detail for a specific source identified by source_id."""
    try:
        source = Source.objects.get(pk=source_id)
    except Source.DoesNotExist:
        return skip_cache(Response(NOT_FOUND_RESPONSE_DATA, status=404))

    serializer = SourceDetailSerializer(source)
    return skip_cache(Response(serializer.data))
