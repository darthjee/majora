"""View re-issuing a copy link upload so a pending, failed or expired link can be retried."""

from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from uploads.models import Upload


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_copy_link_renew(request, upload_id):
    """Renew copy upload `upload_id` for the caller: new token/expiry, pending, no error."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    with transaction.atomic():
        upload = _locked_copy_upload(upload_id)
        if upload is None:
            return Response(status=404)
        if _is_settled_or_in_flight(upload):
            return Response(status=409)
        upload.renew(request.user)

    return Response(
        {'upload_id': upload.pk, 'upload_type': upload.upload_type, 'token': upload.token}
    )


def _locked_copy_upload(upload_id):
    """Return the copy-origin upload `upload_id` locked for update, or None."""
    return (
        Upload.objects.select_for_update()
        .filter(pk=upload_id, origin=Upload.ORIGIN_COPY)
        .first()
    )


def _is_settled_or_in_flight(upload):
    """Return True when the upload is `uploaded`, or `uploading` and not yet expired."""
    if upload.status == Upload.STATUS_UPLOADED:
        return True
    return upload.status == Upload.STATUS_UPLOADING and upload.expiration_time > timezone.now()
