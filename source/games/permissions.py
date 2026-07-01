"""Shared authorization checks for character and game editing endpoints."""

from rest_framework.response import Response


class GameEditPermission:
    """Encapsulate the authentication/authorization checks for editing a game."""

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not edit `game`, else None."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not game.can_be_edited_by(request.user):
            return cls._forbidden_response()

        return None

    @classmethod
    def _unauthenticated_response(cls, request):
        """Return a 401 Response if `request.user` is not authenticated, else None."""
        if not request.user or not request.user.is_authenticated:
            return Response({'errors': {'detail': ['authentication required']}}, status=401)
        return None

    @classmethod
    def _forbidden_response(cls):
        """Return a 403 Response for an authenticated user lacking edit rights."""
        return Response({'errors': {'detail': ['not allowed']}}, status=403)


class CharacterEditPermission:
    """Encapsulate the authentication/authorization checks for editing a character."""

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not edit `character`, else None."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not character.can_be_edited_by(request.user):
            return cls._forbidden_response()

        return None

    @classmethod
    def _unauthenticated_response(cls, request):
        """Return a 401 Response if `request.user` is not authenticated, else None."""
        if not request.user or not request.user.is_authenticated:
            return Response({'errors': {'detail': ['authentication required']}}, status=401)
        return None

    @classmethod
    def _forbidden_response(cls):
        """Return a 403 Response for an authenticated user lacking edit rights."""
        return Response({'errors': {'detail': ['not allowed']}}, status=403)


class TreasureEditPermission:
    """Encapsulate the authentication/authorization checks for editing a treasure."""

    @classmethod
    def check(cls, request, treasure):
        """Return an error Response if `request.user` may not edit `treasure`, else None."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not treasure.can_be_edited_by(request.user):
            return cls._forbidden_response()

        return None

    @classmethod
    def _unauthenticated_response(cls, request):
        """Return a 401 Response if `request.user` is not authenticated, else None."""
        if not request.user or not request.user.is_authenticated:
            return Response({'errors': {'detail': ['authentication required']}}, status=401)
        return None

    @classmethod
    def _forbidden_response(cls):
        """Return a 403 Response for an authenticated user lacking edit rights."""
        return Response({'errors': {'detail': ['not allowed']}}, status=403)
