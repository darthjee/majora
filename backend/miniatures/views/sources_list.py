"""View for listing sources or creating a new one."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.query_filters import filter_by_name
from games.paginator import Paginator
from games.views.common import require_staff, validated_or_error

from ..models import Source
from ..serializers import SourceCreateSerializer, SourceDetailSerializer, SourceListSerializer
from ._shared import skip_cache


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sources_list(request):
    """Return a paginated list of sources, or create a new one."""
    if request.method == 'POST':
        return _create_source(request)

    queryset = filter_by_name(request, Source.objects.all())
    page, headers = Paginator(request, queryset).paginate()
    serializer = SourceListSerializer(page, many=True)
    return skip_cache(Response(serializer.data, headers=headers))


def _create_source(request):
    """Validate the request, create a new source, and return 201 with detail data."""
    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    serializer = SourceCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return skip_cache(error_response)

    source = serializer.save()
    detail = SourceDetailSerializer(source)
    return skip_cache(Response(detail.data, status=201))
