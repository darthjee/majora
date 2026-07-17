# Backend Plan: Allow players and staff to upload PC photos

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /games/:game_slug/pcs/:id/photo_upload.json` must return `201` for: superuser, DM,
  the PC's own owning player (all already true today, must keep working), any other player
  of the character's game (`Player.games` membership), and any `is_staff=True` user
  (global). Response shape unchanged.
- This new leniency applies only to the PC photo-upload endpoint, not to
  `NpcPlayerEditPermission` (NPC photo upload stays exactly as-is) nor to
  `CharacterEditPermission` (full PC editing stays owner/DM/superuser-only).
- No serializer field changes — the frontend derives upload eligibility from the existing
  `is_player`/`is_staff` (`/access.json`) and `can_edit` (`/permissions.json`) fields.

## Implementation Steps

### Step 1 — Add a dedicated PC photo-upload permission

In `backend/games/permissions.py`, add a new class alongside `NpcPlayerEditPermission`
(around line 42-65):

```python
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
```

Do not modify `NpcPlayerEditPermission` — it must keep its current, narrower behavior for
NPCs (no `is_staff` bypass there).

### Step 2 — Wire the new permission into the shared upload view

In `backend/games/views/game/_photo_upload.py`:
- Line 9: import `CharacterPhotoUploadPermission` instead of `CharacterEditPermission`
  (drop the now-unused `CharacterEditPermission` import if nothing else in this file uses
  it).
- Line 19: change
  `permission_class = NpcPlayerEditPermission if npc else CharacterEditPermission`
  to
  `permission_class = NpcPlayerEditPermission if npc else CharacterPhotoUploadPermission`.

### Step 3 — Update/add backend tests

File: `backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py`
- Keep `test_unrelated_user_returns_403` as-is (that user has no game membership at all —
  still correctly 403 under the new rule).
- Add a test that a player of the game who does **not** own this specific PC gets `201`
  (mirror `game_npc_photo_upload_test.py`'s `test_player_of_game_returns_201`: create a
  `PlayerFactory` with `player.games.add(self.game)`, no PC ownership, assert `201`).
- Add a test that a `is_staff=True` user with no other relationship to the game gets `201`.
- Add a test that a `is_staff=True` user who is also unrelated to the game still isn't
  blocked (staff bypass is global, not game-scoped) — can be the same test as above.

File: `backend/games/tests/views/game/npcs/detail/game_npc_photo_upload_test.py`
- `test_player_of_game_cannot_upload_pc_photo` (around line 170-185) currently asserts a
  player of the game gets `403` on the **PC** photo-upload endpoint. This assertion is now
  false — update it to assert `201` instead (rename the test to reflect the new behavior,
  e.g. `test_player_of_game_can_upload_pc_photo`), since PCs now grant the same
  any-player-of-game leniency NPCs already had.

### Step 4 — Update product/access-control documentation

Per `docs/agents/architecture.md`'s rule that `docs/agents/access-control.md` must be
updated whenever `docs/agents/product.md`'s access rules change:

- `docs/agents/product.md`:
  - The Editing Rules paragraph (around line 179) currently states "...this remains
    NPC-only; PC photo upload still requires the character's owning player, a GameMaster,
    or a superuser." Replace/extend this to describe the new PC photo-upload rule (any
    player of the game, or staff, in addition to owner/DM/superuser), parallel to the
    existing NPC photo-upload (#429) paragraph above it.
  - The Staff Role section (around line 118-144) states Staff has "no authority over any
    game-scoped resource — Character, Player, GameMaster, GameSession, Task...". Add an
    explicit, named exception: Staff may upload a **PC's** photo (global, any game) as of
    this issue. `NpcPlayerEditPermission` is unchanged and still has no staff bypass, so
    do not describe this as covering NPC photo upload too.
  - Update the Summary Table to add/adjust the PC photo-upload row.
- `docs/agents/access-control/upload.md`:
  - Update the permission named for `POST /games/:game_slug/pcs/:id/photo_upload.json`
    from `CharacterEditPermission` to `CharacterPhotoUploadPermission`.

## Files to Change

- `backend/games/permissions.py` — add `CharacterPhotoUploadPermission`.
- `backend/games/views/game/_photo_upload.py` — use the new permission for PCs.
- `backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py` — add
  player-of-game and staff coverage.
- `backend/games/tests/views/game/npcs/detail/game_npc_photo_upload_test.py` — update the
  now-outdated `test_player_of_game_cannot_upload_pc_photo` expectation.
- `docs/agents/product.md` — document the new PC photo-upload rule and the Staff exception.
- `docs/agents/access-control/upload.md` — update the documented permission class name.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- `can_be_edited_by` already covers superuser/DM/owner, so `CharacterPhotoUploadPermission`
  only needs to add the `is_staff` and "any player of the game" branches on top of it —
  no changes needed to `Character.can_be_edited_by` or `can_be_edited_by_roles`.
- `parse_role_booleans` (`backend/games/views/common.py`) documents that `player`/`staff`
  role names are accepted but silently no-op for `can_be_edited_by_roles`. That's unrelated
  to this change (it backs the role-simulated `/permissions.json` full-edit check, which
  this issue does not touch) — no change needed there.
