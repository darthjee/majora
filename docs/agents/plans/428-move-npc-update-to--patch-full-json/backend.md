# Backend Plan: Move npc update to `PATCH full.json`

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce: `PATCH` support on `game_npc_full` (`/games/:game_slug/npcs/:id/full.json`) and
`game_pc_full` (`/games/:game_slug/pcs/:id/full.json`), accepting the same
`CharacterUpdateSerializer` fields as today's plain-endpoint PATCH, returning the
`CharacterFullSerializer` shape with `X-Skip-Cache: true` on success, and the same
401/403/400/404 semantics the plain endpoint has today. Must remove `PATCH` from
`game_npc_detail`/`game_pc_detail` (GET-only from now on). Frontend depends on this contract
being in place before it repoints its URL.

## Implementation Steps

### Step 1 — Add PATCH to the full view

In `source/games/views/characters/_full.py`, extend `character_full()` to handle both `GET`
and `PATCH`, reusing the `detail_or_update` helper from `views/common.py` the same way
`_detail.py` does today (pass `CharacterEditPermission`, `CharacterUpdateSerializer` for
writes, `CharacterFullSerializer` for both the read and the post-update read, with
`detail_context={'request': request}`).

Important nuance: unlike `_detail.py`, the `full.json` endpoint's `GET` must **also** be
gated behind `CharacterEditPermission` (it exposes `private_description`, unlike the plain
detail endpoint, which is public). `detail_or_update`'s `GET` branch does not check
permission on its own — only its `PATCH` branch does (via `_update`'s internal call to
`permission_cls.check`). So keep the explicit `CharacterEditPermission.check(request,
character)` call before invoking `detail_or_update`, the same way the current `character_full`
already does for `GET`. This means `PATCH` requests pay for the permission check twice
(once explicit, once inside `detail_or_update`'s `_update`); that redundancy is intentional
and harmless — do not try to special-case it away.

Keep setting `X-Skip-Cache: true` on the response regardless of method.

### Step 2 — Wire PATCH into the URL-facing views

In `source/games/views/characters/game_npc_full.py` and `game_pc_full.py`, change
`@api_view(['GET'])` to `@api_view(['GET', 'PATCH'])`.

### Step 3 — Make the plain detail endpoints GET-only

In `source/games/views/characters/game_npc_detail.py` and `game_pc_detail.py`, change
`@api_view(['GET', 'PATCH'])` to `@api_view(['GET'])`.

In `source/games/views/characters/_detail.py`, simplify `character_detail()` to drop the
update path entirely: it no longer needs `CharacterUpdateSerializer`, `CharacterEditPermission`,
or `detail_or_update` (which exists specifically to multiplex GET/PATCH — with PATCH now
unreachable here, calling it would leave dead code behind). Serialize directly with
`CharacterDetailSerializer` via context, keeping the existing hidden-NPC gate
(`_hidden_gate_response`) and `X-Skip-Cache` behavior for NPCs untouched.

### Step 4 — Move the PATCH tests

In `source/games/tests/views/characters/game_character_detail_test.py`, remove
`_BaseCharacterUpdateViewTest`, `TestGameNpcUpdateView`, and `TestGamePcUpdateView` in their
entirety (all PATCH-endpoint tests) — keep only the GET-detail tests
(`_BaseCharacterDetailViewTest`, `TestGameNpcDetailView`, `TestGamePcDetailView`, and
`TestGameNpcDetailHidden`, which stays as-is since hidden-gating is a GET concern).

In `source/games/tests/views/characters/game_character_full_test.py`, add those same PATCH
test classes back, retargeted at the full endpoint (`.../full.json` instead of `.../.json`,
reusing `self._url()` from `_BaseCharacterFullViewTest`). Preserve every existing behavior
they assert (401/403/400 cases, multi-field updates, negative money, links create/update/
delete/rollback, `slain`/`public_allegiance` handling, "ignores non-editable fields" per
`docs/agents/security-guidelines.md` section 8) — this is a relocation, not a rewrite. Note
the full endpoint's editor tokens differ slightly from the plain endpoint's in the existing
GET tests (e.g. NPC editor there is a DM, not a superuser) — reconcile fixture setup so both
GET and PATCH test classes in this file share `_editor_token()` consistently per class.

### Step 5 — Update the access-control doc

Update `docs/agents/access-control.md` (per the "Endpoints" style already used there) to move
the PATCH row from the plain detail endpoints to the `full.json` endpoints, and to note the
plain detail endpoints are now GET-only. This doc still has a stale reference to the removed
`slain.json` endpoint from the prior #425/#426 fix — leave that pre-existing cleanup out of
scope for this issue unless it's trivial to fix in passing.

## Files to Change

- `source/games/views/characters/_full.py` — add PATCH handling (permission check + update
  serializer), keep GET behavior.
- `source/games/views/characters/game_npc_full.py` — add `'PATCH'` to `@api_view`.
- `source/games/views/characters/game_pc_full.py` — add `'PATCH'` to `@api_view`.
- `source/games/views/characters/game_npc_detail.py` — drop `'PATCH'` from `@api_view`.
- `source/games/views/characters/game_pc_detail.py` — drop `'PATCH'` from `@api_view`.
- `source/games/views/characters/_detail.py` — simplify to GET-only, no update serializer.
- `source/games/tests/views/characters/game_character_detail_test.py` — remove PATCH test
  classes.
- `source/games/tests/views/characters/game_character_full_test.py` — add PATCH test classes,
  retargeted at `full.json`.
- `docs/agents/access-control.md` — reflect the moved endpoint.

## CI Checks

- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- No model, serializer field-set, or permission-logic changes — `CharacterUpdateSerializer`,
  `CharacterFullSerializer`, and `CharacterEditPermission` are reused as-is.
- Coordinate with the frontend agent: land this backend change (or at least keep both
  endpoints working) before/alongside the frontend URL switch, since the frontend's
  `updateCharacter` is shared by both `pcs` and `npcs` and the plan moves both together.
