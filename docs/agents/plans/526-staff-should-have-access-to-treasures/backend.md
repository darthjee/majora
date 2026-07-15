# Backend Plan: Staff should have access to treasures page and endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- No new fields or response shapes. Only *who* may call the existing global-Treasure write
  endpoints changes: `is_staff` now behaves like `is_superuser`, but only when the treasure
  is global (`game_id is None`). Game-scoped Treasure routes are untouched.
- `is_staff`/`is_superuser` are already exposed to the frontend via `/auth/status.json` and
  `GET /treasures/<id>/access.json` — no new endpoint or field is needed for frontend to
  consume this change.

## Implementation Steps

### Step 1 — Fix the root permission check: `Treasure.can_be_edited_by`

`backend/games/models/treasure/treasure.py:32-40` is the single source of truth consumed by
`TreasureEditPermission.check` (used by `PATCH /treasures/<id>.json` via
`treasure_detail.py:26-29`, and by `POST /treasures/<id>/photo_upload.json` via
`treasure_photo_upload.py:44`, for a global treasure) and by
`TreasurePermissionsSerializer._get_can_edit_for_real_user`
(`backend/games/serializers/treasures/treasure_permissions.py:18-23`, which drives
`GET /treasures/<id>/permissions.json`'s `can_edit`).

Change:

```python
def can_be_edited_by(self, user):
    return bool(
        user and user.is_authenticated
        and (user.is_superuser or (user.is_staff and self.game_id is None))
    )
```

Update the method's docstring (currently says "superuser only") to describe the new rule:
superuser always; staff only for a global treasure (`game_id is None`) — a game-exclusive
treasure still requires superuser or that game's GameMaster (handled elsewhere, unaffected).

Fixing this one method automatically and consistently covers update, photo upload, and
`permissions.json`'s `can_edit` — no need to touch those call sites individually.

### Step 2 — Fix create: `treasures_list.py`

`backend/games/views/treasures/treasures_list.py:37` currently has an inline
`if not request.user.is_superuser` check, bypassing the model method (this view only ever
creates global treasures — there is no `game` field on `TreasureCreateSerializer`, so no
`game_id is None` guard is needed here). Change to:

```python
if not (request.user.is_superuser or request.user.is_staff):
```

### Step 3 — Leave role-simulation (`?role=`) untouched

`Treasure.can_be_edited_by_roles` (`treasure.py:42-49`) and `parse_role_booleans`
(`backend/games/views/common.py:113-133`) are a separate "preview as a role" feature that
today only simulates `superuser`/`dm`/`owner` — `staff` is accepted in the query param but
intentionally a no-op (documented in `parse_role_booleans`'s own docstring). This issue is
about a real staff user's own access, not the role-simulation preview feature — do **not**
add staff simulation here; it's out of scope and would be a separate issue.

### Step 4 — Update access-control documentation (same PR, per `architecture.md`)

`docs/agents/product.md` (around lines 104-116, "Staff Role" section) currently states
Staff is "additive" and explicitly names Treasure management as something Staff must
*not* get — that sentence must be rewritten, not merely extended. Replace the section
with wording establishing: Staff has full parity with Superuser on any endpoint **not
scoped under a specific game** (today: User management, and the global Treasure
endpoints listed below); Staff gains no authority over any game-scoped resource
(Character, Player, GameMaster, GameSession, Task, or the `/games/:game_slug/treasures*`
routes), and never reaches into Django-admin-only actions (e.g. Treasure/Game deletion —
see `access-control.md`'s existing admin carve-out). Update the Staff summary-table row to
match.

`docs/agents/access-control/user-roles.md:10` — update the Staff row the same way (today:
"grants access to the User-management endpoints below only, nothing else").

`docs/agents/access-control/treasure.md`:
- Line 4: "write endpoints on the global routes (create and update) remain restricted to
  superusers" → "...restricted to superusers or staff".
- Line 19 (`Create (POST /treasures.json)`): "Superuser only" → "Superuser or Staff".
- Line 20 (`Update (PATCH /treasures/<id>.json)`): "Superuser only (includes... the global
  endpoint stays superuser-only regardless of `game`)" → "Superuser or Staff (...stays
  superuser-or-staff-only regardless of `game`)".
- Line 21 (`Create photo`): "Superuser always" → "Superuser or Staff, always" (staff gated
  the same way — only for a global treasure; a game-scoped treasure's photo upload still
  goes through `GameEditPermission`, untouched).
- Line 22 (`Delete`): no change needed for the policy itself, but note precisely — there is
  no *application-level* delete endpoint for treasures at all (verified: only GET/POST on
  `treasures_list.py`, GET/PATCH on `treasure_detail.py`); deletion is Django-admin-only and
  stays out of scope per `access-control.md`'s admin carve-out, regardless of this issue.
- Lines 78-84 (`## Edit permission`): note explicitly that the real-identity path now
  includes staff for a global treasure, while the `?role=` simulated path (line 81-84)
  still treats a global treasure as superuser-only even under simulation — this asymmetry
  is intentional (Step 3 above), not a bug to fix here.

`docs/agents/access-control/common-rules.md`:
- Line 11 (`TreasureEdit` row): "Superuser only" → "Superuser or Staff (staff only for a
  global treasure; a game-scoped treasure still requires GameEdit)".
- Line 20 (`Treasure.can_be_edited_by(user)` prose): update to match Step 1's new rule.

## Files to Change

- `backend/games/models/treasure/treasure.py` — broaden `can_be_edited_by` to include staff
  for global treasures; update its docstring.
- `backend/games/views/treasures/treasures_list.py` — broaden the inline superuser check on
  create to include staff.
- `docs/agents/product.md` — rewrite the "Staff Role" section and summary-table row.
- `docs/agents/access-control/user-roles.md` — update the Staff row.
- `docs/agents/access-control/treasure.md` — update Create/Update/Create-photo/Delete rows
  and the intro paragraph, plus the Edit-permission section's simulation note.
- `docs/agents/access-control/common-rules.md` — update the `TreasureEdit` row and the
  `Treasure.can_be_edited_by` prose line.
- Existing pytest files covering `Treasure.can_be_edited_by`, `treasures_list` (create),
  `treasure_detail` (update), and `treasure_photo_upload` — add staff-user cases (global
  treasure: staff succeeds; game-scoped treasure: staff still forbidden unless also
  GameMaster/superuser). Locate via `grep -rl "can_be_edited_by\|treasures_list\|treasure_detail\|treasure_photo_upload" backend/games/tests/` (or wherever this project's pytest tree mirrors `backend/games/views/treasures/` and `backend/games/models/treasure/`).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_views_rest` /
  `pytest_all`, whichever covers `games/views/treasures` and `games/models/treasure`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- The fix is deliberately made at the single model-method root
  (`Treasure.can_be_edited_by`) rather than patched ad hoc in each view, so update, photo
  upload, and `permissions.json`'s `can_edit` all stay consistent automatically — avoid
  re-introducing a per-endpoint `is_staff` check that could drift out of sync again.
  `TreasurePermissionsSerializer`'s game-scoped fallback path
  (`treasure.game.can_be_edited_by(user)`, `treasure_permissions.py:23`) is untouched by
  this change — a game-scoped treasure remains governed only by `Game.can_be_edited_by`
  (GameMaster/superuser), never staff.
- Precedent already exists for a Staff-or-superuser-gated non-user-management endpoint:
  `POST /users/test-email.json` via `require_staff` (`docs/agents/access-control/endpoints.md:51`,
  `backend/games/views/common.py:18-25`) — cite this in the docs rewrite as evidence the
  broadened policy is a generalization, not an invention.
