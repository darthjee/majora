"""View for the staff photos index (resize limit and photo-type slugs)."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.settings import Settings
from games.views.common import require_staff

from .. import photo_types


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_photos_index(request):
    """Return the photo resize limit and the ordered list of photo-type slugs."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    return Response({
        'max_dimension': Settings.photo_max_dimension(),
        'types': photo_types.slugs(),
    })
