"""View for the crawler-import endpoint: upserts a single STL model."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.views.common import require_staff, validated_or_error

from ..serializers import StlModelDetailSerializer, StlModelImportSerializer
from ._shared import skip_cache


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stl_model_import(request):
    """Upsert a single STL model from a crawler-import payload (staff-only).

    Returns 201 (with detail data) when a new `StlModel` was created, 200 when an existing one
    was matched and updated.
    """
    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    serializer = StlModelImportSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return skip_cache(error_response)

    stl_model = serializer.save()
    detail = StlModelDetailSerializer(stl_model)
    status = 201 if serializer.created else 200
    return skip_cache(Response(detail.data, status=status))
