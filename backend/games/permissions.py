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

    Also the permission rule for the "set as profile photo" action (issue #852): both the
    PC and NPC photo-set endpoints share it with the photo-upload endpoints, since setting a
    profile photo is itself a photo action rather than a general character edit.

    Exposes `is_allowed` as a public classmethod (unlike the previous private `_is_allowed`)
    because `CharacterDetailSerializer.get_can_set_profile_photo` needs the exact same rule,
    computed from a `request.user` that may be anonymous — mirroring the precedent already
    set by `CharacterMoneyEditPermission`'s docstring for the same reason.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for `character`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` is staff, a player of the game, or may edit outright."""
        if not user or not user.is_authenticated:
            return False
        is_player_of_game = character.game.has_player(user)
        return user.is_staff or is_player_of_game or character.can_be_edited_by(user)


class CharacterPhotoDeletePermission(_EditPermission):
    """Allow only staff, a DM of the character's game, or a superuser to delete a photo.

    Deliberately narrower than CharacterPhotoUploadPermission (issue #721): unlike that
    class, this one never allows the owning player or any other player of the game — photo
    deletion is admin/dm/staff only.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not delete a photo for `character`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` is staff, a DM of the character's game, or a superuser."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.game.can_be_edited_by(user)


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


class GameDocumentPhotoUploadPermission(_EditPermission):
    """Broadened document photo-upload action, mirroring GameItemPhotoUploadPermission (#749)."""

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not upload a document photo."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is staff, a player of the game, or may edit it outright."""
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)


class GameDocumentFileUploadPermission(_EditPermission):
    """Broadened document file-upload action, mirroring GameDocumentPhotoUploadPermission (#726)."""

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not upload a document file."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is staff, a player of the game, or may edit it outright."""
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)


class GameDocumentFilePhotoUploadPermission(_EditPermission):
    """Broadened document file photo-upload action, mirroring GameDocumentFileUploadPermission."""

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not upload a document file's photo."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is staff, a player of the game, or may edit it outright."""
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)


class GameItemCreatePermission(_EditPermission):
    """Encapsulate checks for the game-level item-creation endpoint (issue #784).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) plus any player of the game (issue #864) — mirroring
    CharacterItemPlayerCreatePermission's shape, minus the PC-owner allowance since a bare
    GameItem has no owning character.
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
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
        """Return whether a role-simulated caller may create a new item for a game."""
        return is_staff or is_superuser or is_dm or is_player


class GameDocumentCreatePermission(_EditPermission):
    """Encapsulate checks for the game-level document-creation endpoint (issue #758).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) plus any player of the game (issue #864) — mirroring
    GameItemCreatePermission's shape, since a bare GameDocument has no owning character.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not create a document for `game`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        """Return whether `user` may create a new document for `game`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
        """Return whether a role-simulated caller may create a new document for a game."""
        return is_staff or is_superuser or is_dm or is_player


class NpcPlayerCreatePermission(_EditPermission):
    """Encapsulate checks for the player-facing NPC-creation endpoint (issue #868).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) plus any player of the game — mirroring GameItemCreatePermission/
    GameDocumentCreatePermission's shape, since a to-be-created NPC has no owning character yet.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not create an NPC for `game`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        """Return whether `user` may create a new player-facing NPC for `game`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
        """Return whether a role-simulated caller may create a new player-facing NPC."""
        return is_staff or is_superuser or is_dm or is_player


class CharacterMoneyEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, money-only character edit endpoint (issue #615).

    Grants the same access as full CharacterEditPermission (superuser, the character's
    owning player, or a GameMaster of the game) plus any Staff account (globally, not
    scoped to games the Staff user is otherwise involved in) — mirroring
    CharacterPhotoUploadPermission's Staff bypass (issue #619). For PCs, this also mirrors
    CharacterPhotoUploadPermission's "any player of the game" grant (issue #625). NPCs have
    no owner concept, so that leniency is deliberately PC-only: NPC money editing stays
    admin/dm/staff-only.

    Exposes `is_allowed` as a public classmethod because CharacterDetailSerializer's
    `can_edit_money` field needs the exact same rule, computed from a `request.user` that
    may be anonymous — the same reason `CharacterPhotoUploadPermission.is_allowed` is public.
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


class CharacterRegularEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, player-writable PC update endpoint (issue #865).

    Grants the same access as CharacterEditPermission (superuser, the character's owning
    player, or a GameMaster of the game) plus any Staff account (globally), plus — PC-only —
    any other player of the game. Deliberately mirrors CharacterMoneyEditPermission's exact
    shape (issues #615/#625) rather than reusing that class directly, so the two endpoints'
    rules can diverge independently later, per this module's existing convention (see
    CharacterItemCreatePermission/CharacterItemPhotoUploadPermission). PC-only: NPCs have no
    counterpart to this endpoint at all.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not perform this PC update."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may edit `character`'s regular (non-private) field set."""
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

    Also reused, unchanged, by the public (non-`/all`) item acquire/remove endpoints (issue
    #773) — creating/removing a `CharacterItem` from an existing catalog `GameItem` is
    authorized by the exact same rule as creating one from scratch.
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


class CharacterItemPlayerCreatePermission(_EditPermission):
    """Broadened PC/NPC item create+update permission (issue #864): any player of the game,
    in addition to CharacterItemCreatePermission's existing dm/admin/staff/owner-of-PC grant.

    A new class rather than a change to CharacterItemCreatePermission, since that class is also
    reused unchanged by the item acquire/remove endpoints (issue #773), out of scope here.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not create/update an item."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may create/update an item for `character`."""
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or character.game.has_player(user):
            return True
        return character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_player, is_pc):
        """Return whether a role-simulated caller may create/update an item for a character."""
        if is_staff or is_superuser or is_dm or is_player:
            return True
        return is_owner if is_pc else False


class CharacterItemPhotoUploadPermission(_EditPermission):
    """Encapsulate checks for the PC/NPC item photo-upload endpoint (issue #750).

    Broadened per issue #864: the PC side now grants any player of the game (mirroring
    CharacterPhotoUploadPermission's "any player of the game" grant for a character's own
    photo), while the NPC side is narrowed to drop the Staff bypass — an NPC has no owner
    concept, so NPC item photo uploads stay superuser/DM (i.e. `can_be_edited_by`) only. Kept
    as its own class (not a reuse of CharacterItemCreatePermission/
    CharacterItemPlayerCreatePermission) so this action's rules can diverge independently.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for the item."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may upload a photo for an item held by `character`.

        PCs: staff, any player of the game, or `can_be_edited_by` (dm/admin/owner). NPCs: no
        Staff bypass (narrowed per issue #864) — `can_be_edited_by` (dm/admin) only.
        """
        if not user or not user.is_authenticated:
            return False
        if character.is_pc:
            if user.is_staff or character.game.has_player(user):
                return True
            return character.can_be_edited_by(user)
        return character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_player, is_pc):
        """Return whether a role-simulated caller may upload a photo for a character's item."""
        if is_pc:
            if is_staff or is_player or is_superuser or is_dm:
                return True
            return is_owner
        return is_superuser or is_dm


class TreasureEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a treasure."""


class GameSessionEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game session.

    Broadened (issue #864) beyond plain GameEditPermission: any Staff account (globally), or
    any player of the game, in addition to dm/superuser. `check`/`is_allowed` accept either a
    `Game` (the create endpoint) or a `GameSession` (the update endpoint) as `obj`, resolving
    to the underlying `Game` either way, since a session has no independent player/edit rule.
    """

    @classmethod
    def check(cls, request, obj):
        """Return an error Response if `request.user` may not create/edit a session."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, obj))

    @classmethod
    def is_allowed(cls, user, obj):
        """Return whether `user` may create/edit a session for `obj`'s game."""
        if not user or not user.is_authenticated:
            return False
        game = cls._game_for(obj)
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)

    @classmethod
    def _game_for(cls, obj):
        """Return the `Game` for `obj`, which may be a `Game` itself or a `GameSession`."""
        return getattr(obj, 'game', obj)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
        """Return whether a role-simulated caller may create/edit a session for a game."""
        return is_staff or is_superuser or is_dm or is_player


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

    Previously deliberately narrower than most permission checks in this module (no
    superuser/staff bypass, issue #695/#589). Issue #864 intentionally reverses that
    exclusion as part of the broader player-empowerment policy: Staff/Superuser now also
    pass, mirroring `_is_admin_or_player` (already used by `PollPermission`/
    `SessionMessagePermission`'s/`PollVotePermission`'s view-only checks) — see
    `docs/agents/access-control/player.md` and `docs/agents/access-control/conversation.md`.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not view `game`'s players."""
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        """Return whether `user` is a player or the DM of `game`, or Staff/Superuser."""
        return cls._is_admin_or_player(user, game)


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
