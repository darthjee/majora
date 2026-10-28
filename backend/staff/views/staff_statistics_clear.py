"""View for clearing all visit statistics, restricted to staff/superuser."""

import logging
import time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from statistics.reset import StatisticsReset

logger = logging.getLogger(__name__)

_LOG_FORMAT = (
    'staff_statistics_clear status=%s staff_id=%s deleted_visits=%s deleted_sessions=%s '
    'duration_ms=%s'
)


def log_statistics_clear(
    status, staff_id, deleted_visits, deleted_sessions, duration_ms, error=None,
):
    """Log one statistics-clear audit line, never including the IP, user details or message."""
    args = (status, staff_id, deleted_visits, deleted_sessions, duration_ms)
    if error is None:
        logger.info(_LOG_FORMAT, *args)
    else:
        logger.warning(_LOG_FORMAT + ' error=%s', *args, error)


@restricted
@api_view(['DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_clear(request):
    """Delete every visit and session, reset their ids and return the deleted counts."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    reset = _run_reset(request.user.id)
    return Response(
        {'deleted_visits': reset.deleted_visits, 'deleted_sessions': reset.deleted_sessions},
        status=200,
    )


def _run_reset(staff_id):
    """Run the statistics reset, logging the outcome; re-raise on failure."""
    reset = StatisticsReset()
    start = time.monotonic()
    try:
        reset.run()
    except Exception as exc:
        _log_reset(reset, 'failed', staff_id, start, error=type(exc).__name__)
        raise
    _log_reset(reset, 'success', staff_id, start)
    return reset


def _log_reset(reset, status, staff_id, start, error=None):
    """Write the audit line for a reset with its counts and elapsed time."""
    log_statistics_clear(
        status, staff_id, reset.deleted_visits, reset.deleted_sessions,
        _elapsed_ms(start), error=error,
    )


def _elapsed_ms(start):
    """Return the milliseconds elapsed since the `time.monotonic()` value `start`."""
    return int((time.monotonic() - start) * 1000)
