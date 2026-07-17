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


class CharacterPhotoUploadPermission(_EditPermission):
    """Encapsulate the checks for the broadened PC photo-upload action (issue #619).

    Allows any player of the character's game, or any staff user (globally), in addition
    to the standard can_be_edited_by chain (superuser, DM, owner). Deliberately narrower
    in scope than NpcPlayerEditPermission's reuse: this class exists only for PC photo
    upload and must not be reused for general PC editing.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for `character`."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._is_allowed(request.user, character):
            return cls._forbidden_response()
        return None

    @classmethod
    def _is_allowed(cls, user, character):
        """Return whether `user` is staff, a player of the game, or may edit outright."""
        is_player_of_game = character.game.players.filter(user=user).exists()
        return user.is_staff or is_player_of_game or character.can_be_edited_by(user)


class CharacterMoneyEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, money-only character edit endpoint (issue #615).

    Grants the same access as full CharacterEditPermission (superuser, the character's
    owning player, or a GameMaster of the game) plus any Staff account (globally, not
    scoped to games the Staff user is otherwise involved in) — mirroring
    CharacterPhotoUploadPermission's Staff bypass (issue #619), but deliberately without its
    additional "any player of the game" grant: NPCs have no owner, so this stays
    admin/dm/staff-only for NPCs, and a regular player may only use it on their own PC (via
    the inherited owner check), never on an NPC.

    Exposes `is_allowed` as a public classmethod (unlike CharacterPhotoUploadPermission's
    private `_is_allowed`) because CharacterDetailSerializer's `can_edit_money` field needs
    the exact same rule, computed from a `request.user` that may be anonymous.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not edit `character`'s money."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls.is_allowed(request.user, character):
            return cls._forbidden_response()
        return None

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may edit `character`'s money (Staff bypass or full edit rights)."""
        return bool(user and user.is_staff) or character.can_be_edited_by(user)


class TreasureEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a treasure."""


class GameSessionEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game session."""


class TaskEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for accessing/editing a task."""


class SessionMessagePermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for session messages.

    View is allowed for any player of the session's game, that game's DM, superusers, and
    staff. Create is stricter: only an actual player or DM of the game (no superuser/staff
    bypass), per the issue's explicit permission list.
    """

    @classmethod
    def check_view(cls, request, session):
        """Return an error Response if `request.user` may not view `session`'s messages."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_view(request.user, session):
            return cls._forbidden_response()
        return None

    @classmethod
    def check_create(cls, request, session):
        """Return an error Response if `request.user` may not post to `session`."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_create(request.user, session):
            return cls._forbidden_response()
        return None

    @classmethod
    def _can_view(cls, user, session):
        game = session.game
        return (
            user.is_superuser or user.is_staff
            or game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )

    @classmethod
    def _can_create(cls, user, session):
        game = session.game
        return (
            game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )


class PollPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for game polls.

    Unlike SessionMessagePermission, view and create share the exact same check: the
    game's DM(s), players, and admins (superuser/staff) — no stricter create-only rule,
    per the issue's explicit permission list for all three poll endpoints.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not view/create polls for `game`."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._is_allowed(request.user, game):
            return cls._forbidden_response()
        return None

    @classmethod
    def _is_allowed(cls, user, game):
        return (
            user.is_superuser or user.is_staff
            or game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )


class PollClosePermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for closing a game poll.

    Unlike `PollPermission` (which also allows players and staff), closing a poll is
    restricted to the game's DM(s) or superusers only — this is exactly the rule
    `Game.can_be_edited_by` already implements, so `_EditPermission.check`'s default
    `obj.can_be_edited_by(user)` behavior is reused verbatim.
    """


class PollVotePermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for game poll votes.

    Mirrors SessionMessagePermission's split: view is allowed for the game's DM(s),
    players, and admins (superuser/staff); voting is stricter, only an actual player
    or DM of the game may cast a vote (no superuser/staff bypass).
    """

    @classmethod
    def check_view(cls, request, game):
        """Return an error Response if `request.user` may not view `game`'s poll votes."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_view(request.user, game):
            return cls._forbidden_response()
        return None

    @classmethod
    def check_vote(cls, request, game):
        """Return an error Response if `request.user` may not vote in `game`'s polls."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._can_vote(request.user, game):
            return cls._forbidden_response()
        return None

    @classmethod
    def _can_view(cls, user, game):
        return (
            user.is_superuser or user.is_staff
            or game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )

    @classmethod
    def _can_vote(cls, user, game):
        return (
            game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )
