# Backend Plan: Allow Npc Edit

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the widened `PATCH /games/:game_slug/npcs/:id.json` body described in
[plan.md](plan.md)'s "Shared contracts" section: `public_description`, `allegiance` (→
`public_allegiance`), `slain` (→ `public_slain`, unchanged), `links` (nested, same shape/sync
semantics as `CharacterUpdateSerializer.links`). Still gated by the existing
`NpcPlayerEditPermission` — no permission class changes. `full.json`/`CharacterEditPermission`/
`CharacterUpdateSerializer` are untouched.

## Implementation Steps

### Step 1 — Widen the narrow write serializer

`backend/games/serializers/characters/npcs/npc_slain_update.py` currently defines
`NpcSlainUpdateSerializer` with a single `slain = BooleanField(source='public_slain')` field.
Since it's no longer slain-only, rename the class and file to reflect its new scope (e.g.
`NpcPlayerUpdateSerializer` / `npc_player_update.py`, per the PC/NPC sub-split convention in
[serializers-organization.md](../../serializers-organization.md) — this file already lives in
`characters/npcs/` since its logic is NPC-only). Add:

- `public_description` — plain `CharField`/passthrough (matches the model field directly, no
  `source=` needed).
- `allegiance = ChoiceField(source='public_allegiance', choices=...)` — reuse
  `Character`'s existing allegiance choices (see how `CharacterUpdateSerializer`
  declares/reuses `allegiance`/`public_allegiance` in
  `backend/games/serializers/characters/character_update.py` for the `ModelSerializer`
  auto-generated field, or declare explicitly with `source='public_allegiance'`).
- `links = CharacterLinkWriteSerializer(many=True, required=False)` — reuse the same nested
  serializer `CharacterUpdateSerializer` already uses
  (`games.serializers.characters.character_link_write.CharacterLinkWriteSerializer`), plus its
  `validate_links` (`validate_links_count`) and `update()` override that pops `links` and
  applies them via `CharacterLinksSync` — copy this pattern rather than inventing a new one.

Keep every field `required=False` (partial-update semantics, same as today's `slain`).

### Step 2 — Update the view wiring

`backend/games/views/game/npcs/_npc_slain_update.py` imports `NpcSlainUpdateSerializer` and
passes it into `detail_or_update(...)`. Update the import and the function name/docstring to
match the renamed serializer (e.g. rename the file/function too if it no longer reads naturally
as "slain update" — check `backend/games/views/game/npcs/game_npc_detail.py`, which imports
`npc_slain_update` from this module, and update that import to match). No change needed to
`NpcPlayerEditPermission` itself (`backend/games/permissions.py`) — it already grants access to
any player of the game, on top of the usual dm/admin/superuser rule.

### Step 3 — Update the re-export

`backend/games/serializers/__init__.py` re-exports every serializer by name — update it for the
renamed class, and check `backend/games/serializers/characters/npcs/__init__.py` (if one exists)
for the same.

### Step 4 — Tests

- Rename/extend the existing serializer test (mirrors
  `backend/games/serializers/characters/npcs/npc_slain_update.py` under
  `backend/games/tests/serializers/`, if a dedicated test file exists there) to cover the new
  fields: valid partial updates for each of `public_description`, `allegiance`, `links`,
  individually and combined; confirm `name`/`role`/`money`/`private_description`/real `slain` are
  never accepted or written by this serializer.
- Extend `backend/games/tests/views/game/npcs/game_npc_detail_test.py` (the existing
  `PATCH .../npcs/:id.json` view test) with cases for a **player of the game** (not dm/admin,
  not superuser) successfully PATCHing each new field, and confirm dm/admin/superuser can still
  use this route too (unchanged from today's `slain`-only coverage, per
  `NpcPlayerEditPermission`'s "everyone `CharacterEdit` grants, OR any player" rule).
- Confirm a non-player, non-editor requester still gets rejected (403/401 per the existing
  convention), and that a hidden NPC still 404s for a non-editor (the `_hidden_gate_response`
  check in `_npc_slain_update.py`/its renamed successor is unaffected but should stay covered).

### Step 5 — Update docs

Update `docs/agents/access-control/character.md`'s "Narrow NPC slain-toggle PATCH" section (and
its heading, since it's no longer slain-only) to document the widened field set, keeping the
existing prose about the hidden-NPC gate and response shape. Cross-check
`docs/agents/product.md`'s "Editing Rules" section (issue #416/#429 paragraphs) for the same
naming — no rule changes needed there, just note the widened field set if it mentions specific
fields.

## Files to Change

- `backend/games/serializers/characters/npcs/npc_slain_update.py` — rename/widen to accept
  `public_description`, `allegiance`, `links` alongside `slain`.
- `backend/games/views/game/npcs/_npc_slain_update.py` — update import/naming for the renamed
  serializer.
- `backend/games/views/game/npcs/game_npc_detail.py` — update the import if the view module is
  renamed.
- `backend/games/serializers/__init__.py` — update the re-export for the renamed class.
- `backend/games/tests/serializers/characters/npcs/npc_slain_update_test.py` (or equivalent) —
  extend/rename for the new fields.
- `backend/games/tests/views/game/npcs/game_npc_detail_test.py` — extend with player-editor
  coverage for the new fields.
- `docs/agents/access-control/character.md` — document the widened narrow-PATCH field set.

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI job: backend test suite)
- `backend/`: `docker-compose run --rm majora_be ruff check .` (CI job: backend lint), line
  length 100

## Notes

- No migration needed — every new field maps to an existing `Character` column
  (`public_description`, `public_allegiance`, existing `links` relation).
- Keep `full.json`/`CharacterUpdateSerializer`/`CharacterEditPermission` completely untouched;
  this issue only widens the narrower, player-facing route.
- Populating `Player.games` (making `is_player` actually evaluate `true` for real users in
  production) is explicitly out of scope per the issue — this plan builds on
  `NpcPlayerEditPermission`/`is_player` exactly as they exist today.
