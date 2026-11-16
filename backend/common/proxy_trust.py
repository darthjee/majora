"""Decide whether a request came through the trusted Tent proxy."""

import logging
import os

from common.secret_compare import secret_matches

PROXY_ENFORCE_WITHOUT_SECRET = (
    'PROXY_ENFORCE is on but PROXY_SECRET is not set: enforcement is a no-op'
)

logger = logging.getLogger('common')


def proxy_secret():
    """Return the configured proxy shared secret, or '' if unset (trust disabled)."""
    return os.environ.get('PROXY_SECRET', '')


def has_valid_proxy_secret(request):
    """Return whether the request carries an `X-Proxy-Secret` matching `PROXY_SECRET`.

    Always `False` when `PROXY_SECRET` is empty.
    """
    return secret_matches(request.META.get('HTTP_X_PROXY_SECRET'), proxy_secret())


def is_via_proxy(request):
    """Return whether the request counts as coming through the proxy.

    Unlike `has_valid_proxy_secret`, an empty `PROXY_SECRET` means trusted: with no secret
    configured (development, tests) there is no way to tell proxied requests apart, so none
    are treated as bypassing it.
    """
    if not proxy_secret():
        return True
    return has_valid_proxy_secret(request)


def enforce_enabled():
    """Return whether `PROXY_ENFORCE` is set to `true` (case-insensitive)."""
    return os.environ.get('PROXY_ENFORCE', '').lower() == 'true'


def warn_if_enforce_without_secret():
    """Log a warning when `PROXY_ENFORCE` is on but `PROXY_SECRET` is empty."""
    if enforce_enabled() and not proxy_secret():
        logger.warning(PROXY_ENFORCE_WITHOUT_SECRET)
