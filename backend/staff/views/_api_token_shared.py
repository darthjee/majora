"""Shared helpers for the staff scoped-API-token views."""

import logging

from games.views.common import require_session, require_staff

logger = logging.getLogger(__name__)


def staff_session_error(request):
    """Return the 403 (scoped token), 401 or 403 (not staff) Response, else None.

    `require_session` runs first, so a scoped token always gets `token_not_allowed`.
    """
    return require_session(request) or require_staff(request)


def log_api_token_action(action, token_id, user_id, staff_user_id):
    """Log a staff scoped-API-token mutation, never including the secret or its hash."""
    logger.info(
        'staff_api_token_action action=%s api_token_id=%s user_id=%s staff_id=%s',
        action, token_id, user_id, staff_user_id,
    )
