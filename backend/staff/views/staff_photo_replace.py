"""View for initiating a staff replace of an existing photo's file."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from games.decorators import restricted
from games.views.common import require_staff

from ..staff_photo_replacer import StaffPhotoReplacer
from ._staff_photo_shared import find_staff_photo


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_photo_replace(request, photo_type, photo_id):
    """Create a staff `Upload` replacing the file of an existing photo row."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    entry, photo, error_response = find_staff_photo(photo_type, photo_id)
    if error_response:
        return error_response

    return StaffPhotoReplacer(request, entry, photo).run()
