"""View for listing every photo row of one photo type, restricted to staff."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.paginator import Paginator
from games.views.common import require_staff

from .. import photo_types
from ..serializers import StaffPhotoListSerializer
from ..staff_photo_list_context import StaffPhotoListContext


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_photos_list(request, photo_type):
    """Return a paginated, newest-first list of every photo of `photo_type`."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    entry = photo_types.find(photo_type)
    if entry is None:
        return Response(status=404)

    return _paginated_response(request, entry)


def _paginated_response(request, entry):
    """Paginate the entry's photos and serialize the page with its batch-loaded context."""
    page, headers = Paginator(request, entry.queryset()).paginate()
    photos = list(page)
    context = StaffPhotoListContext(entry, photos).build()
    serializer = StaffPhotoListSerializer(photos, many=True, context=context)
    return Response(serializer.data, headers=headers)
