# Backend Plan: Allow players to do some minor edits to NPCs

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce: `PATCH /games/:game_slug/npcs/:id.json` accepting only `{"slain": true|false}`,
writing `public_slain`, permitted for a player of the game (via the same computation backing
`is_player`) or the existing `CharacterEditPermission` (GM/superuser), returning the same
`CharacterDetailSerializer` shape the endpoint's `GET` already returns, with
`X-Skip-Cache: true`. No change needed to expose `is_player` — it's already computed by
`BaseAccessSerializer`/`CharacterAccessSerializer` and already fetched by the frontend.

Must produce a **generic, reusable** permission class (`NpcPlayerEditPermission`, not a
slain-specific one) — issue #429 ("Allow players to perform NPC photo upload") depends on this
plan and reuses this exact class for the NPC photo-upload endpoints, since it needs the
identical "is a player of this game OR `CharacterEditPermission`" check. Do not name or scope
this permission around `slain` specifically.

**Prerequisite:** issue #428 must already be implemented (plain NPC/PC detail views GET-only,
`full.json` PATCH-capable) — build against that shape, not the current one.

## Implementation Steps

### Step 1 — Add the "is player of the game" permission check

In `source/games/permissions.py`, add a new permission class named `NpcPlayerEditPermission`
(generic — not `NpcSlainPermission` — since #429 also reuses it for the NPC photo-upload
endpoints), alongside the existing `_EditPermission` subclasses. It should reuse
`_EditPermission._unauthenticated_response`/`_forbidden_response` but replace the
`can_be_edited_by`-only check with: allowed if
`character.game.players.filter(user=request.user).exists()` (the exact query
`BaseAccessSerializer._get_is_player` uses, `source/games/serializers/base_access.py:81`) OR
`character.can_be_edited_by(request.user)`. Keep it Character-specific (it needs `.game`), not
a generic `_EditPermission` subclass reused for non-character resources.

### Step 2 — Add the minimal slain-update serializer

Add a new serializer (e.g. `NpcSlainUpdateSerializer` in
`source/games/serializers/npc_slain_update.py`, registered in `source/games/serializers/__init__.py`)
as a `ModelSerializer` for `Character` with a single field:
`slain = serializers.BooleanField(source='public_slain')` and `fields = ['slain']`. This maps
the wire-level `slain` key straight onto the model's `public_slain` column via `source`,
mirroring how `CharacterDetailSerializer.slain` already reads it back
(`source/games/serializers/character_detail.py:24`). No custom `update()` needed —
`ModelSerializer`'s default handles a single scalar field.

This intentionally resembles the shape of the now-deleted `CharacterSlainUpdateSerializer`
(removed in #425/#426, `git show 3eff323^:source/games/serializers/character_slain_update.py`
for reference) but is narrower (only `slain`→`public_slain`, no real `slain`/`public_slain`
dual-field support — the real `slain` field stays `full.json`-only) and pairs with a different
permission.

### Step 3 — Wire PATCH into the NPC-only plain view

This must be NPC-only — the PC plain endpoint stays GET-only (#428), since PCs have owners and
this issue doesn't touch PC editing at all.

In `source/games/views/characters/game_npc_detail.py`:
- Change `@api_view(['GET'])` (post-#428 state) back to `@api_view(['GET', 'PATCH'])`.
- On `PATCH`, dispatch to new logic instead of the shared (GET-only, post-#428)
  `character_detail()` — e.g. a new `_npc_slain_update.py` helper:
  1. `_get_character_or_404(game, character_id, npc=True)` (reuse from `_shared.py`).
  2. `_hidden_gate_response(character, request)` (reuse from `_shared.py`) — keep the hidden-NPC
     gate consistent with `GET`'s behavior on this same route.
  3. `NpcPlayerEditPermission.check(request, character)` (Step 1).
  4. Validate/save with `NpcSlainUpdateSerializer(character, data=request.data, partial=True)`,
     using `validated_or_error`/`save_or_error` from `views/common.py` (same helpers
     `detail_or_update` uses internally).
  5. On success, respond with `CharacterDetailSerializer(character, context={'request':
     request}).data` and set `X-Skip-Cache: true` — matching this route's existing `GET`
     response shape exactly.
- `game_pc_detail.py` is untouched (stays `@api_view(['GET'])` from #428).

### Step 4 — Tests

Add a new test module (or extend `game_character_detail_test.py`'s NPC-only section) covering
the NPC plain-PATCH endpoint post-#428:
- 401 unauthenticated, 200 for a player of the game (`game.players` linkage — build this
  directly in the test via the `Player`/`Game` M2M, independent of whatever eventually
  populates it in production), 200 for GM/superuser, 403 for an authenticated user who is
  neither a player of the game nor an editor.
- Payload validation: `{"slain": true}` sets `public_slain` True and leaves the real `slain`
  field untouched; a payload with any other key (e.g. `name`, `money`, `public_allegiance`) is
  silently ignored (same "ignores non-editable fields" contract other update serializers have,
  per `docs/agents/security-guidelines.md` section 8).
- Hidden-NPC gate still applies (404 for non-editors, same as `GET`).
- Response shape matches `GET`'s `CharacterDetailSerializer` output.

### Step 5 — Update docs

- `docs/agents/product.md`: add a fourth Editing Rules branch — a player of the game (per
  `is_player`) may toggle an NPC's `public_slain`, distinct from the existing
  superuser/owner/GameMaster rules and scoped only to this one field/endpoint.
- `docs/agents/access-control.md`: document the new `PATCH /games/:game_slug/npcs/:id.json`
  permission/payload, and correct the stale pre-#425 "Character slain-toggle endpoint" /
  PATCH-table sections this doc still carries (lines ~195-223, ~411-418) while touching this
  area — reconcile with whatever #428 already changed here.

## Files to Change

- `source/games/permissions.py` — new `NpcPlayerEditPermission` (generic, also reused by #429).
- `source/games/serializers/npc_slain_update.py` — new `NpcSlainUpdateSerializer`.
- `source/games/serializers/__init__.py` — export it.
- `source/games/views/characters/game_npc_detail.py` — restore `PATCH`, dispatch to new logic.
- `source/games/views/characters/_npc_slain_update.py` (new) — the PATCH handling described
  in Step 3.
- `source/games/tests/views/characters/game_character_detail_test.py` (or a new
  `game_npc_slain_update_test.py`) — new endpoint tests.
- `docs/agents/product.md`, `docs/agents/access-control.md` — updated per Step 5.

## CI Checks

- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- Do not touch `CharacterUpdateSerializer`, `CharacterEditPermission`, or the PC plain/full
  endpoints — this issue is additive and NPC-only.
- `Player.games` is still never populated by any production write path as of this issue
  (tracked separately, per #410's known gap) — the permission check and its tests must not
  assume that gap is closed; they should build/assert the `Player.games` link directly in test
  setup, the same way `is_player`'s own tests presumably do.
