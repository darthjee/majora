"""Shared authorization checks for character, game, treasure, and session editing endpoints."""

from rest_framework.response import Response

from .caches import AdminOrStaffCache


class _EditPermission:
    """Encapsulate the authentication/authorization checks for editing an object."""

    @classmethod
    def check(cls, request, obj):
        """Return an error Response if `request.user` may not edit `obj`, else None."""
        return cls._guarded_check(request, lambda: obj.can_be_edited_by(request.user))

    @classmethod
    def _guarded_check(cls, request, predicate):
        """Return a 401/403 error Response if unauthenticated/`predicate()` is False, else None."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated

        if not predicate():
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

    @classmethod
    def _is_admin_or_player(cls, user, game):
        """Return whether `user` is a superuser, staff, or a player of `game`."""
        return AdminOrStaffCache.is_admin_or_staff(user) or game.has_player(user)


class GameEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game."""


class CharacterEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a character."""


class NpcPlayerEditPermission(_EditPermission):
    """Encapsulate the checks for a narrow, player-facing NPC edit (e.g. toggling slain).

    Generic on purpose (not slain-specific), though the only remaining consumer is the
    "toggle slain" endpoint. Previously also reused by the NPC photo-upload endpoints
    (issue #429), but issue #713 moved those to CharacterPhotoUploadPermission.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not perform this NPC edit."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, character))

    @classmethod
    def _is_allowed(cls, user, character):
        """Return whether `user` is a player of `character`'s game, or may edit it outright."""
        is_player_of_game = character.game.has_player(user)
        return is_player_of_game or character.can_be_edited_by(user)


class CharacterPhotoUploadPermission(_EditPermission):
    """Encapsulate the checks for the broadened character photo-upload action (issue #619).

    Allows any player of the character's game, or any staff user (globally), in addition
    to the standard can_be_edited_by chain (superuser, DM, owner). Used unconditionally for
    both PCs and NPCs, at both the photo-upload init endpoint and the upload_finalize
    _check_permission branches (issues #619, #668, and #713 for the NPC side), and must not
    be reused for general character editing.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for `character`."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, character))

    @classmethod
    def _is_allowed(cls, user, character):
        """Return whether `user` is staff, a player of the game, or may edit outright."""
        is_player_of_game = character.game.has_player(user)
        return user.is_staff or is_player_of_game or character.can_be_edited_by(user)


class GameItemPhotoUploadPermission(_EditPermission):
    """Broadened item photo-upload action, mirroring CharacterPhotoUploadPermission (#619)."""

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not upload a photo for `game`'s item."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is staff, a player of the game, or may edit it outright."""
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)


class GameItemCreatePermission(_EditPermission):
    """Encapsulate checks for the game-level item-creation endpoint (issue #784).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) — mirroring CharacterItemCreatePermission's shape, minus the
    PC-owner allowance since a bare GameItem has no owning character.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not create an item for `game`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        """Return whether `user` may create a new item for `game`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff):
        """Return whether a role-simulated caller may create a new item for a game."""
        return is_staff or is_superuser or is_dm


class CharacterMoneyEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, money-only character edit endpoint (issue #615).

    Grants the same access as full CharacterEditPermission (superuser, the character's
    owning player, or a GameMaster of the game) plus any Staff account (globally, not
    scoped to games the Staff user is otherwise involved in) — mirroring
    CharacterPhotoUploadPermission's Staff bypass (issue #619). For PCs, this also mirrors
    CharacterPhotoUploadPermission's "any player of the game" grant (issue #625). NPCs have
    no owner concept, so that leniency is deliberately PC-only: NPC money editing stays
    admin/dm/staff-only.

    Exposes `is_allowed` as a public classmethod (unlike CharacterPhotoUploadPermission's
    private `_is_allowed`) because CharacterDetailSerializer's `can_edit_money` field needs
    the exact same rule, computed from a `request.user` that may be anonymous.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not edit `character`'s money."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may edit `character`'s money.

        Staff bypass applies globally to both PCs and NPCs. The "any player of the game"
        leniency is PC-only (issue #625) — NPCs have no owner concept and stay
        admin/dm/staff-only.
        """
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        if character.is_pc and character.game.has_player(user):
            return True
        return character.can_be_edited_by(user)


class CharacterTreasureExchangePermission(_EditPermission):
    """Encapsulate checks for the PC/NPC treasure buy/sell endpoints (issue #712).

    Grants the same access as CharacterEditPermission (superuser, the character's owning
    player, or a GameMaster of the game) plus any Staff account (globally). Unlike
    CharacterMoneyEditPermission, deliberately has no "any player of the game" leniency —
    per the issue's clarified Staff principle (admin-like power, but no access to
    secret/hidden content), and the buy/all.json hidden-treasure variant stays gated by
    GameEditPermission only, so Staff never gains access to hidden treasures through this.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not exchange treasure for `character`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may buy/sell treasure on behalf of `character`."""
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return character.can_be_edited_by(user)


class CharacterItemCreatePermission(_EditPermission):
    """Encapsulate checks for the PC/NPC item-creation endpoint (issue #714).

    Grants the same access as CharacterEditPermission (superuser, the character's owning
    player, or a GameMaster of the game) plus any Staff account (globally) — mirroring
    CharacterTreasureExchangePermission's shape. `can_be_edited_by` alone already yields
    exactly dm/admin/staff for NPCs (no owner concept) and dm/admin/staff/owner for PCs once
    the Staff bypass is added, so no per-kind branching is needed. Exposes public
    `is_allowed`/`is_allowed_for_roles` classmethods so CharacterPermissionsSerializer's
    `can_create_item` field can reuse the exact same rule for both the real-identity and
    role-simulated (`?role=`) paths.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not create an item for `character`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may create a new item for `character`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_pc):
        """Return whether a role-simulated caller may create a new item for a character.

        Mirrors `Character.can_be_edited_by_roles`, plus the same Staff bypass as `is_allowed`.
        `is_pc` is passed explicitly (rather than a `Character` instance) since `is_owner` is
        only ever meaningful for a PC — an NPC has no ownership concept.
        """
        if is_staff or is_superuser or is_dm:
            return True
        return is_owner if is_pc else False


class CharacterItemPhotoUploadPermission(_EditPermission):
    """Encapsulate checks for the PC/NPC item photo-upload endpoint (issue #750).

    Deliberately mirrors CharacterItemCreatePermission's formula exactly (dm/admin/staff, plus
    the owning player for PCs) rather than CharacterPhotoUploadPermission's broader "any player
    of the game" grant used for a character's own photo — per the issue's explicit "admin,
    owner, staff and dm" authorization ask. Kept as its own class (not a reuse of
    CharacterItemCreatePermission) so the two actions' rules can diverge independently later.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for the item."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may upload a photo for an item held by `character`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_pc):
        """Return whether a role-simulated caller may upload a photo for a character's item.

        Mirrors `CharacterItemCreatePermission.is_allowed_for_roles` exactly.
        """
        if is_staff or is_superuser or is_dm:
            return True
        return is_owner if is_pc else False


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
        return cls._guarded_check(request, lambda: cls._can_view(request.user, session))

    @classmethod
    def check_create(cls, request, session):
        """Return an error Response if `request.user` may not post to `session`."""
        return cls._guarded_check(request, lambda: cls._can_create(request.user, session))

    @classmethod
    def _can_view(cls, user, session):
        return cls._is_admin_or_player(user, session.game)

    @classmethod
    def _can_create(cls, user, session):
        return session.game.has_player(user)


class PollPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for game polls.

    Unlike SessionMessagePermission, view and create share the exact same check: the
    game's DM(s), players, and admins (superuser/staff) — no stricter create-only rule,
    per the issue's explicit permission list for all three poll endpoints.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not view/create polls for `game`."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        return cls._is_admin_or_player(user, game)


class PlayerPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for a game's players/conversations.

    Deliberately narrower than most permission checks in this module: no superuser/staff
    bypass. Staff/superuser have no legitimate reason to browse a game's roster or a
    player's conversations (issue #695), so this class intentionally breaks the
    project-wide "superusers always have full access" default documented in
    `docs/agents/access-control.md` — see `docs/agents/access-control/player.md` and
    `docs/agents/access-control/conversation.md`.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not view `game`'s players."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is a player or the DM of `game`."""
        return game.has_player(user)


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
        return cls._guarded_check(request, lambda: cls._can_view(request.user, game))

    @classmethod
    def check_vote(cls, request, game):
        """Return an error Response if `request.user` may not vote in `game`'s polls."""
        return cls._guarded_check(request, lambda: cls._can_vote(request.user, game))

    @classmethod
    def _can_view(cls, user, game):
        return cls._is_admin_or_player(user, game)

    @classmethod
    def _can_vote(cls, user, game):
        return game.has_player(user)
