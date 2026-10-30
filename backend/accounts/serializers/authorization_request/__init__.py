"""Authorization-request serializers package for the accounts app."""

from accounts.serializers.authorization_request.list import AuthorizationRequestListSerializer
from accounts.serializers.authorization_request.scopes import AuthorizationRequestScopesSerializer

__all__ = [
    'AuthorizationRequestListSerializer',
    'AuthorizationRequestScopesSerializer',
]
