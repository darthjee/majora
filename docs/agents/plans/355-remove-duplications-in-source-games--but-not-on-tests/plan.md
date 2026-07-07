# Plan: Remove duplications in source/games (but not on tests)

Issue: [355-remove-duplications-in-source-games--but-not-on-tests.md](../issues/355-remove-duplications-in-source-games--but-not-on-tests.md)

## Overview

Reduce the pc/npc view-function duplication in `source/games/views/characters/` by extending
the shared-body pattern that already exists for `_photo_upload.py`, `_photo_set.py`,
`_slain_set.py`, and `_treasure_exchange.py` to the remaining pairs that still inline their
logic (`access`, `detail`, `full`, `photos`, `treasures`), and consolidate the repeated
character-lookup line. Also do a lighter sweep of the rest of `source/games` (outside
`views/characters/` and outside all tests) for any other confirmed duplication. Entirely
within the `backend` agent's scope — no serializer/permission/model contract changes, no new
endpoints, purely an internal refactor that must keep every endpoint's request/response
behavior byte-identical.

## Context

`source/games/views/characters/` has 11 pc/npc file pairs. Verified during exploration (by
reading every pair):

- **Already de-duplicated** (thin wrapper + shared body module, taking an explicit `npc`
  bool): `game_npc_photo_upload.py`/`game_pc_photo_upload.py` (→ `_photo_upload.py`),
  `game_npc_photo_set.py`/`game_pc_photo_set.py` (→ `_photo_set.py`),
  `game_npc_slain_set.py` (→ `_slain_set.py`, no PC counterpart), and
  `game_npc_treasure_acquire.py`/`game_pc_treasure_acquire.py` +
  `game_npc_treasure_sell.py`/`game_pc_treasure_sell.py` (→ `_treasure_exchange.py`). These
  are the pattern to replicate — no changes needed here beyond the lookup consolidation in
  Step 1 below (they still each inline `_find_character(...)` + a manual
  `if character is None: raise Http404`).
- **Still inlined, same lookup shape** — `game_npc_full.py`/`game_pc_full.py`: fully
  identical body (same serializer, same permission), differing only in the
  `npc=True`/`npc=False` literal passed to `get_object_or_404(Character, ...)`.
- **Still inlined, with a real asymmetry to preserve** —
  `game_npc_detail.py`/`game_pc_detail.py`,
  `game_npc_photos.py`/`game_pc_photos.py` (in `_shared.py` as `_hidden_gate_response`... no,
  not yet used by pc variant), and
  `game_npc_treasures.py`/`game_pc_treasures.py`: the NPC variant additionally calls
  `_hidden_gate_response(character, request)` (from `_shared.py`) and, for photos/treasures,
  sets `X-Skip-Cache` when `character.hidden`; the PC variant does neither. This is an
  existing, deliberate behavioral asymmetry (only NPCs can be hidden in practice) — **not** a
  bug to fix. Any extraction must keep the PC path exempt from the hidden-gate/skip-cache
  logic, e.g. via an explicit parameter the thin wrapper passes in, not a hardcoded
  `if npc:` inside the shared function.
- **Still inlined, different serializer class** —
  `game_npc_access.py`/`game_pc_access.py`: identical shape except
  `CharacterAccessSerializer` vs `PcAccessSerializer` (the latter already subclasses the
  former to add `is_owner` — serializers themselves are already clean, see below). The
  serializer class is the one thing that must stay parametrized/passed in rather than
  unified, since the two serializers are genuinely different.
- **Asymmetric, no real pair** — `game_npcs.py` (GET list + POST create) vs `game_pcs.py`
  (GET list only, and no `hidden=False` filter — PCs are never hidden); `game_npcs_all.py`
  (DM/superuser-only "all NPCs" listing) has no PC counterpart at all. Leave the POST/create
  logic and the all-NPCs listing NPC-only; only consider extracting the trivially shared
  "paginate `game.characters.filter(npc=...)` with `CharacterListSerializer`" line if it
  reads cleanly, without forcing the `hidden=False` filter onto the PC side.
- **Serializers already clean** — `source/games/serializers/pc_access.py`'s
  `PcAccessSerializer` already subclasses `character_access.py`'s `CharacterAccessSerializer`
  and only adds `is_owner`; no duplication there, no action needed.
- Note: `docs/agents/views-organization.md` documents a *separate*, not-yet-applied folder
  reorganization for this same tree (issue #348) — that is a file-location convention change,
  independent of this issue's duplication removal. Do not conflate the two; this issue only
  changes what code exists and where the small amount of shared logic lives, not the overall
  `characters/` vs `game/pcs/`+`game/npcs/` folder layout.

## Implementation Steps

### Step 1 — Consolidate the character lookup

1. Add a small helper to `_shared.py`, e.g. `_get_character_or_404(game, character_id, npc)`,
   wrapping the existing `_find_character(...)` and raising `Http404` when it returns `None`
   (mirroring what `game_npc_treasure_acquire.py`/`game_pc_treasure_acquire.py` already do
   inline).
2. Migrate every pair that currently does its own
   `get_object_or_404(Character, id=character_id, game=game, npc=True/False)` or inline
   `_find_character(...)` + manual `raise Http404` (full, detail, photos, treasures, the
   already-shared `_photo_upload.py`/`_photo_set.py`/`_slain_set.py`/`_treasure_exchange.py`
   bodies) to use the new helper instead. This alone removes one duplicated line per file
   across ~10 files.

### Step 2 — Extend the shared-body pattern to `access`, `detail`, `full`, `photos`, `treasures`

For each of these five pairs, add a private shared module (naming parallel to the existing
ones, e.g. `_access.py`, `_detail.py`, `_full.py`, `_photos.py`, `_treasures.py` — avoid
clashing with the unrelated `_photo_upload.py`/`_photo_set.py`) holding a function that takes
`(request, game, character_id, npc, ...)` plus whatever extra parameter expresses the real
asymmetry, and returns the `Response`. Each `game_npc_X.py`/`game_pc_X.py` then keeps only its
`@api_view`/`@authentication_classes`/`@permission_classes` stack, the `get_object_or_404(Game,
...)` call, its own docstring, and a one-line call into the shared function:

1. **`full`** — fully symmetric; the shared function just does the lookup +
   `CharacterEditPermission.check` + `CharacterFullSerializer` + `X-Skip-Cache`. No extra
   parameter needed beyond `npc`.
2. **`detail`** — shared function takes an explicit `check_hidden: bool` (or equivalently is
   only ever called with the gate check already decided by the caller); `game_npc_detail.py`
   passes `True` (preserving today's `_hidden_gate_response` call and the `X-Skip-Cache`
   header it always sets), `game_pc_detail.py` passes `False` (preserving today's total
   absence of both). Do not infer this from `npc` inside the shared function — make it an
   explicit argument so the asymmetry is visible at each call site and easy to verify against
   current behavior.
3. **`photos`** and **`treasures`** — same `check_hidden`-style explicit parameter, preserving
   the existing NPC-only `_hidden_gate_response` call and conditional `X-Skip-Cache` (only set
   when `character.hidden`), with the PC variant behaving exactly as it does today (no gate,
   no header).
4. **`access`** — shared function takes the serializer class as a parameter (or the thin
   wrapper keeps calling `access_response(...)` directly with its own serializer class import
   right after resolving the character via the Step 1 helper) — this pair's only real
   duplication is the lookup, already handled in Step 1; do not force `CharacterAccessSerializer`
   and `PcAccessSerializer` into a single call path, since they are legitimately different
   serializers.

After each pair, diff the new thin wrapper's behavior against the version in `git show
HEAD:<path>` mentally (or via the existing test suite) to confirm no observable change:
same status codes, same headers, same payload shape, same permission/auth stack.

### Step 3 — Leave the genuinely asymmetric files alone

- `game_npcs.py` (`GET`+`POST`) / `game_pcs.py` (`GET`-only): only extract the trivial shared
  "paginate `game.characters.filter(npc=...)` via `CharacterListSerializer`" line if doing so
  doesn't force the NPC-only `hidden=False` filter onto the PC side or vice versa; keep
  `_create_npc` NPC-only.
- `game_npc_slain_set.py` and `game_npcs_all.py`: no PC counterpart exists; leave as-is
  (already minimal, and already routed through `_slain_set.py` for the former).

### Step 4 — Broader sweep of `source/games` (production code, excluding all tests)

Do a lighter pass over the rest of `source/games` (models, serializers, permissions, and the
other `views/` subfolders: `games/`, `treasures/`, `game_masters/`, `game_sessions/`, `staff/`,
`auth/`, `password_reset/`) looking for confirmed duplication of the same caliber as the
pc/npc pairs (near-identical functions/classes differing only in a literal or a
name) — not superficial similarity. `serializers/pc_access.py` was already checked and is
clean (proper subclassing, no action needed). If genuine duplication is found elsewhere,
apply the same approach (shared base / extracted helper + thin call sites); if none is found
beyond what's covered in Steps 1–3, note that explicitly rather than force an extraction.

### Step 5 — Verify

Run the full backend dev cycle (lint, complexity, and the characters view test suite at
minimum, plus the rest if Step 4 touches other folders) after each step, fixing anything that
breaks. No test file should need to change if behavior is truly unchanged — if a test does
need touching, it means a status code, header, or payload shape drifted from the original and
that must be fixed in the view code instead, not papered over in the test (test-suite
de-duplication itself is out of scope per the issue, but existing tests are the acceptance
gate for "no behavior change").

## Files to Change

- `source/games/views/characters/_shared.py` — add `_get_character_or_404` helper.
- `source/games/views/characters/_access.py`, `_detail.py`, `_full.py`, `_photos.py`,
  `_treasures.py` (new, names illustrative) — shared bodies for the five remaining pairs.
- `source/games/views/characters/game_npc_access.py`, `game_pc_access.py`,
  `game_npc_detail.py`, `game_pc_detail.py`, `game_npc_full.py`, `game_pc_full.py`,
  `game_npc_photos.py`, `game_pc_photos.py`, `game_npc_treasures.py`,
  `game_pc_treasures.py` — reduced to thin wrappers.
- `source/games/views/characters/_photo_upload.py`, `_photo_set.py`, `_slain_set.py`,
  `_treasure_exchange.py`, and their thin wrappers
  (`game_{npc,pc}_photo_upload.py`, `game_{npc,pc}_photo_set.py`, `game_npc_slain_set.py`,
  `game_{npc,pc}_treasure_{acquire,sell}.py`) — migrated to the Step 1 lookup helper only.
- `source/games/views/characters/game_npcs.py`, `game_pcs.py` — only touched if the trivial
  shared listing line is worth extracting without breaking the `hidden=False` asymmetry.
- Any additional file identified during the Step 4 broader sweep.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/characters/ --cov` (CI job:
  `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/
  --cov` (CI job: `pytest_views_rest`) — run if Step 4 touches other `views/` subfolders
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) —
  run if Step 4 touches models/serializers/permissions
- `backend`: `ruff check .` (CI job: `checks`)
- `backend`: `bin/reports.sh ci` (CI job: `checks`, Python complexity)

Run these through the containerized toolchain (e.g. `docker-compose run majora_tests poetry
run pytest ...`, `docker-compose run majora_tests poetry run ruff check .`) — never invoke
`poetry`/`python` directly on the host.

## Notes

- This issue is entirely within the `backend` agent's scope (no frontend/infra/proxy files
  touched), so this plan is not split by agent.
- The main risk is accidentally collapsing the NPC-only hidden-gate/`X-Skip-Cache` behavior
  into the PC path (or vice versa) while extracting shared bodies for `detail`/`photos`/
  `treasures` — Step 2 calls this out explicitly as an asymmetry to preserve via an explicit
  parameter, not something to "fix" or unify.
- No product/access-control or security review is needed beyond a quick confirmation that no
  endpoint's authentication/permission stack or exposed fields changed — this is a pure
  internal refactor with no new endpoints, no serializer field changes, and no
  authentication/authorization logic changes (the same permission classes are still invoked
  with the same objects).
- Test duplication in `source/games/tests` is explicitly out of scope (tracked separately in
  issue #356); existing tests must keep passing unmodified wherever possible, since they are
  the behavior-parity gate for this refactor.
