"""View for deleting one photo row of any photo type, restricted to staff."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from games.decorators import restricted
from games.views.common import require_staff

from ..staff_photo_deleter import StaffPhotoDeleter
from ._staff_photo_shared import find_staff_photo


@restricted
@api_view(['DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_photo_delete(request, photo_type, photo_id):
    """Delete the photo row (204), falling back to another gallery photo when needed."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    entry, photo, error_response = find_staff_photo(photo_type, photo_id)
    if error_response:
        return error_response

    return StaffPhotoDeleter(entry, photo).run()
