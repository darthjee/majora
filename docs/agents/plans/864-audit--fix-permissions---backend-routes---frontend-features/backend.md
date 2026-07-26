# Backend Plan: [AUDIT] Fix Permissions

All classes referenced below live in `backend/games/permissions.py` unless noted. See
[plan.md](plan.md) for the shared `is_player` role-boolean contract used by fixes 2 and 4.

## Fix 1 — Players list: add Staff/Superuser bypass

`PlayerPermission._is_allowed` (`games/permissions.py:429`) currently returns
`game.has_player(user)` only. Change it to also allow Staff/Superuser, mirroring
`_is_admin_or_player` (already defined on `_EditPermission`, used by `PollPermission`/
`SessionMessagePermission`/`PollVotePermission`'s view-only checks):

```python
@classmethod
def _is_allowed(cls, user, game):
    """Return whether `user` is a player or the DM of `game`, or Staff/Superuser."""
    return cls._is_admin_or_player(user, game)
```

This also affects `GET /games/:game_slug/players/<id>.json` (same class) and, as a direct
consequence, `Conversation`'s `GET /games/:game_slug/conversations.json` (reuses
`PlayerPermission` unchanged) — see plan.md's "Side effect to flag".

Update `docs/agents/access-control/player.md`'s "Access-control exception (issue #695)" callout:
it currently instructs "Do not fix this back to the default in a future change." Replace it with
a note that #864 intentionally reverses this exclusion as part of the broader player-empowerment
policy, and update the "Who can" table's List/Show rows accordingly. Apply the equivalent update
to `docs/agents/access-control/conversation.md`'s note about `conversations.json`.

## Fix 2 — PC/NPC item create & update: open to any player of the game

Add a new class, `CharacterItemPlayerCreatePermission` (name it to fit the module's existing
`Character*Permission` conventions), grafted from `CharacterMoneyEditPermission`'s shape but
**without** the `is_pc` restriction — this bucket applies equally to PC and NPC items:

```python
class CharacterItemPlayerCreatePermission(_EditPermission):
    """Broadened PC/NPC item create+update permission (issue #864): any player of the game,
    in addition to CharacterItemCreatePermission's existing dm/admin/staff/owner-of-PC grant.

    A new class rather than a change to CharacterItemCreatePermission, since that class is also
    reused unchanged by the item acquire/remove endpoints (issue #773), out of scope here.
    """

    @classmethod
    def check(cls, request, character):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or character.game.has_player(user):
            return True
        return character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_player, is_pc):
        if is_staff or is_superuser or is_dm or is_player:
            return True
        return is_owner if is_pc else False
```

Swap this into the two call sites that should broaden — `character_item_create`
(`games/views/game/_item_create.py`) and `character_item_update`
(`games/views/game/_item_update.py`) — replacing their `CharacterItemCreatePermission.check(...)`
calls. Leave `_item_exchange.py` untouched (still `CharacterItemCreatePermission`).

Update `CharacterPermissionsSerializer._get_can_create_item`
(`games/serializers/characters/character_permissions.py`) to call the new class instead of
`CharacterItemCreatePermission`, threading `roles['is_player']` through
(`self._get_can_create_item` already receives `roles['is_owner']`/`is_staff`; add `is_player`
from the same `roles` dict once fix's `parse_role_booleans` change lands). This is what makes
`CharacterItemsHelper.jsx`'s create/edit button (`canCreateItem`) open to players automatically —
no frontend code change needed for the flag itself.

Add `is_player` to `parse_role_booleans` (`games/views/common.py`):

```python
return {
    'is_superuser': 'superuser' in roles,
    'is_dm': 'dm' in roles,
    'is_owner': 'owner' in roles,
    'is_staff': 'staff' in roles,
    'is_player': 'player' in roles,
}
```

This is additive and backward compatible (the param was already accepted, just unused).

## Fix 3 — PC/NPC item photo upload: broaden PC, narrow NPC

Modify `CharacterItemPhotoUploadPermission.is_allowed` in place (safe: this class is only used by
this one feature — init, finalize, and the `can_upload_item_photo` flag, all in scope together):

```python
@classmethod
def is_allowed(cls, user, character):
    if not user or not user.is_authenticated:
        return False
    if character.is_pc:
        if user.is_staff or character.game.has_player(user):
            return True
        return character.can_be_edited_by(user)
    # NPC: no Staff bypass (narrowed per issue #864) — superuser/DM/GameEdit-equivalent only.
    return character.can_be_edited_by(user)
```

And `is_allowed_for_roles` symmetrically (needs the new `is_player` role boolean from fix 2):

```python
@classmethod
def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_player, is_pc):
    if is_pc:
        if is_staff or is_player or is_superuser or is_dm:
            return True
        return is_owner
    return is_superuser or is_dm
```

Update the two call sites' signature usage (`character_permissions.py`'s
`_get_can_upload_item_photo`) to pass `roles['is_player']` alongside the existing role booleans.

## Fix 4 — Bare item/document creation: open to any player of the game

`GameItemCreatePermission.is_allowed` and `GameDocumentCreatePermission.is_allowed`
(`games/permissions.py:135`/`:161`) both currently return
`user.is_staff or game.can_be_edited_by(user)`. Add the player grant to both:

```python
@classmethod
def is_allowed(cls, user, game):
    if not user or not user.is_authenticated:
        return False
    return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)
```

And their `is_allowed_for_roles` classmethods, adding `is_player`:

```python
@classmethod
def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
    return is_staff or is_superuser or is_dm or is_player
```

Update `GamePermissionsSerializer._get_can_create_item`/`_get_can_create_document`
(`games/serializers/games/game_permissions.py`) to pass `roles['is_player']` through. As with fix
2, this alone makes `GameItemsController.js`/`GameDocuments.jsx`'s create buttons (`can_create_item`/
`can_create_document`) open to players — no frontend code change needed for the flag itself.

## Fix 5 — Game session create/update: open to Staff and any player of the game

`GameSessionEditPermission` (`games/permissions.py:359`) currently has no override — it falls
back to `_EditPermission.check`'s default `obj.can_be_edited_by(request.user)` (dm/superuser
only, no Staff). Give it a custom `check`/`is_allowed`, mirroring `CharacterMoneyEditPermission`'s
shape but for a `game` object:

```python
class GameSessionEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for editing a game session.

    Broadened (issue #864) beyond plain GameEditPermission: any Staff account (globally), or
    any player of the game, in addition to dm/superuser.
    """

    @classmethod
    def check(cls, request, game):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)
```

Both call sites (`games/views/game_sessions/game_sessions_create.py`,
`games/views/game_sessions/game_session_detail.py`) already call `GameSessionEditPermission.check(request, game)`/
pass the class through — no call-site change needed, only the class body.

Add a new `can_edit_session` field to `GamePermissionsSerializer`
(`games/serializers/games/game_permissions.py`), mirroring `_get_can_create_item`'s shape, backed
by a new `is_allowed_for_roles(is_superuser, is_dm, is_staff, is_player)` classmethod on
`GameSessionEditPermission` (same shape as fix 4's). This is the field
[frontend.md](frontend.md) needs for the "New Session" button and per-session edit gating — see
plan.md's shared-contract note on why the existing generic `can_edit` doesn't already cover this.

## Tests

Every touched permission class has an existing test file under
`backend/games/tests/permissions_test.py` (confirmed present from #865's recent work) — extend it
per fix rather than creating new files, following its existing per-class test-class structure.
Add/update view-level tests under `backend/games/tests/views/` for each touched view file (same
directory layout as the view itself, per `docs/agents/views-organization.md`). Add a test for
`parse_role_booleans` covering `?role=player`.

## CI Checks

`docker-compose run --rm majora_tests pytest` runs the full backend suite (per `AGENTS.md`); ruff
lint via `docker-compose run --rm majora_tests ruff check backend`.
