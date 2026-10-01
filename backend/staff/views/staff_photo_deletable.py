"""View for the staff photo deletable check, consumed by the proxy delete orchestration."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..staff_photo_deleter import has_active_upload
from ._staff_photo_shared import find_staff_photo


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_photo_deletable(request, photo_type, photo_id):
    """Return 200 `{deletable, path}`, or 422 (no body) while a replace is in flight."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    _, photo, error_response = find_staff_photo(photo_type, photo_id)
    if error_response:
        return error_response

    if has_active_upload(photo):
        return Response(status=422)
    return Response({'deletable': True, 'path': photo.path})
