"""Shared authorization checks for character, game, treasure, and session editing endpoints."""

from rest_framework.response import Response


class _EditPermission:
    """Encapsulate the authentication/authorization checks for editing an object."""

    @classmethod
    def check(cls, request, obj):
        """Return an error Response if `request.user` may not edit `obj`, else None."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not obj.can_be_edited_by(request.user):
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


class GameEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game."""


class CharacterEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a character."""


class NpcPlayerEditPermission(_EditPermission):
    """Encapsulate the checks for a narrow, player-facing NPC edit (e.g. toggling slain).

    Generic on purpose (not slain-specific): reused verbatim by the NPC photo-upload
    endpoints (issue #429) for the same "is a player of this game OR an editor" check.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not perform this NPC edit."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not cls._is_allowed(request.user, character):
            return cls._forbidden_response()

        return None

    @classmethod
    def _is_allowed(cls, user, character):
        """Return whether `user` is a player of `character`'s game, or may edit it outright."""
        is_player_of_game = character.game.players.filter(user=user).exists()
        return is_player_of_game or character.can_be_edited_by(user)


class TreasureEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a treasure."""


class GameSessionEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game session."""


class TaskEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for accessing/editing a task."""
