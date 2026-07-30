"""Endpoint (API) access permission checks."""

from rest_framework.response import Response

from .base import BasePermission
from .config_store import PermissionConfigStore

_UNAUTHENTICATED_RESPONSE_DATA = {'errors': {'detail': ['authentication required']}}
_FORBIDDEN_RESPONSE_DATA = {'errors': {'detail': ['not allowed']}}


class EndpointPermission(BasePermission):
    """Expose the show/mutation/delete access rules for a resource's regular/restricted endpoints.

    Always resolves roles from the real user/game/pc (never a role-simulated object outside of
    tests), since endpoint checks gate actual API access rather than a UI preview.
    """

    def allowed(self, resource, type_, action):
        """Return whether the caller may perform `action` on `resource`'s `type_` endpoint."""
        config = PermissionConfigStore.get(resource, 'endpoints')
        entry = config.get(type_, {}).get(action)
        return self._allowed(entry)

    def check(self, request, resource, type_, action):
        """Return a 401/403 error `Response` if `request.user` may not `action`, else `None`."""
        unauthenticated = self._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not self.allowed(resource, type_, action):
            return self._forbidden_response()
        return None

    @staticmethod
    def _unauthenticated_response(request):
        """Return a 401 Response if `request.user` is not authenticated, else None."""
        if not request.user or not request.user.is_authenticated:
            return Response(_UNAUTHENTICATED_RESPONSE_DATA, status=401)
        return None

    @staticmethod
    def _forbidden_response():
        """Return a 403 Response for an authenticated user lacking access."""
        return Response(_FORBIDDEN_RESPONSE_DATA, status=403)
