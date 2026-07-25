"""Views for the passwordless "authorize with logged device" login flow."""

from .authorize import authorize
from .create import create
from .deny import deny
from .list import authorization_requests_list
from .poll import poll

__all__ = [
    'authorization_requests_list',
    'authorize',
    'create',
    'deny',
    'poll',
]
