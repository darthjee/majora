"""View for listing STL models or creating a new one."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.paginator import Paginator
from games.views.common import require_staff, validated_or_error

from ..models import StlModel
from ..serializers import StlModelCreateSerializer, StlModelDetailSerializer, StlModelListSerializer
from ._shared import skip_cache
from ._stl_model_filters import (
    filter_by_collection,
    filter_by_name,
    filter_by_race,
    filter_by_roles,
    filter_by_size,
    filter_by_source,
    filter_by_tags,
    filter_by_type,
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stl_models_list(request):
    """Return a paginated list of STL models, or create a new one."""
    if request.method == 'POST':
        return _create_stl_model(request)

    stl_models = _filtered_stl_models(request)
    page, headers = Paginator(request, stl_models).paginate()
    serializer = StlModelListSerializer(page, many=True)
    return skip_cache(Response(serializer.data, headers=headers))


def _filtered_stl_models(request):
    """Return the STL model queryset filtered by every recognized query param, deduplicated."""
    stl_models = StlModel.objects.all()
    stl_models = filter_by_name(request, stl_models)
    stl_models = filter_by_type(request, stl_models)
    stl_models = filter_by_size(request, stl_models)
    stl_models = filter_by_race(request, stl_models)
    stl_models = filter_by_roles(request, stl_models)
    stl_models = filter_by_source(request, stl_models)
    stl_models = filter_by_collection(request, stl_models)
    stl_models = filter_by_tags(request, stl_models)
    return stl_models.distinct()


def _create_stl_model(request):
    """Validate the request, create a new STL model, and return 201 with detail data."""
    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    serializer = StlModelCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return skip_cache(error_response)

    stl_model = serializer.save()
    detail = StlModelDetailSerializer(stl_model)
    return skip_cache(Response(detail.data, status=201))
