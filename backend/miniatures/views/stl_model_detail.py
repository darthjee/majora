"""View for retrieving or updating a single STL model's detail."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.views.common import detail_or_update, require_staff

from ..models import StlModel
from ..serializers import StlModelDetailSerializer, StlModelUpdateSerializer
from ._shared import NOT_FOUND_RESPONSE_DATA, skip_cache


def _check_stl_model_edit(request, _stl_model):
    """Adapt `require_staff`'s `(request)` signature to `detail_or_update`'s `(request, obj)`."""
    return require_staff(request)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def stl_model_detail(request, stl_model_id):
    """Return detail for a specific STL model (GET), or update it (PATCH, staff-only)."""
    try:
        stl_model = StlModel.objects.get(pk=stl_model_id)
    except StlModel.DoesNotExist:
        return skip_cache(Response(NOT_FOUND_RESPONSE_DATA, status=404))

    return skip_cache(detail_or_update(
        request, stl_model, _check_stl_model_edit,
        StlModelUpdateSerializer, StlModelDetailSerializer,
    ))
