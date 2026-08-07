"""View for retrieving a single STL model's detail."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import StlModel
from ..serializers import StlModelDetailSerializer
from ._shared import NOT_FOUND_RESPONSE_DATA, skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stl_model_detail(request, stl_model_id):
    """Return detail for a specific STL model identified by stl_model_id."""
    try:
        stl_model = StlModel.objects.get(pk=stl_model_id)
    except StlModel.DoesNotExist:
        return skip_cache(Response(NOT_FOUND_RESPONSE_DATA, status=404))

    serializer = StlModelDetailSerializer(stl_model)
    return skip_cache(Response(serializer.data))
