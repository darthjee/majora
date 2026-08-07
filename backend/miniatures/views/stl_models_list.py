"""View for listing STL models."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.paginator import Paginator

from ..models import StlModel
from ..serializers import StlModelListSerializer
from ._shared import skip_cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stl_models_list(request):
    """Return a paginated list of STL models."""
    page, headers = Paginator(request, StlModel.objects.all()).paginate()
    serializer = StlModelListSerializer(page, many=True)
    return skip_cache(Response(serializer.data, headers=headers))
