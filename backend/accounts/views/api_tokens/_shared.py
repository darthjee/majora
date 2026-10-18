"""Shared helpers for the owner-side scoped API token views."""

from games.views.common import require_authenticated, require_session


def session_owner_error(request):
    """Return the 403 (scoped token) or 401 (no session) Response, else None.

    `require_session` runs first, so a scoped token always gets `token_not_allowed`.
    """
    return require_session(request) or require_authenticated(request)
