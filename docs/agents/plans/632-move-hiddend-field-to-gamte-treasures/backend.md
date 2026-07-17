# Backend Plan: Move hidden field from Treasure to GameTreasure

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — backend produces every field/endpoint
listed there; frontend only consumes them.

## Implementation Steps

### Step 1 — Model and migration

- Add `hidden = models.BooleanField(default=False)` to `GameTreasure`
  (`backend/games/models/game/game_treasure.py`).
- Remove `hidden` from `Treasure` (`backend/games/models/treasure/treasure.py:24`).
- Three migrations: (1) `AddField` `GameTreasure.hidden`; (2) a `RunPython` data migration
  backfilling `GameTreasure.objects.filter(treasure__hidden=True).update(hidden=True)`
  before the field is removed; (3) `RemoveField` `Treasure.hidden`. Every `GameTreasure`
  row already exists by the time this runs (backfilled by the earlier migration referenced
  in `docs/agents/access-control/game-treasure.md`), so no row needs to be created here.
- Update `GameTreasureFactory`/`TreasureFactory` in `backend/games/tests/factories.py` to
  match (drop `hidden` from `TreasureFactory`, add it — default `False` — to
  `GameTreasureFactory`).

### Step 2 — Relocate existing reads of `Treasure.hidden`

- `backend/games/views/games/game_treasures.py:35` — replace `treasures.filter(hidden=False)`
  with an `exclude(Exists(...))`/annotate-based filter against the matching `GameTreasure`
  row for `game` (mirror the existing `game_value` subquery pattern in the same file).
- `backend/games/views/games/game_treasure_detail.py` — `_hidden_gate_response` (line 51-57)
  and the `if treasure.hidden:` cache-header check (line 40) both need the resolved
  `GameTreasure` row for `(game, treasure)` instead of `treasure.hidden`. The row is already
  looked up in `_get_game_treasure_or_404`/`_update_game_treasure`; consider fetching it
  once and threading it through instead of re-querying.

### Step 3 — Add hidden-gating that doesn't exist today

These two spots currently have **no** hidden check at all (confirmed by reading
`backend/games/views/game/_treasure_exchange.py` and `backend/games/views/game/_treasures.py`
— the `hidden`/`check_hidden` names in `_treasures.py` refer to `Character.hidden`, an
unrelated field):

- `backend/games/views/game/_treasure_exchange.py::_find_game_treasure` (used by
  `character_treasure_acquire`, shared by both PC and NPC acquire) — raise `Http404` when
  the resolved treasure's `GameTreasure` row (for `game`) has `hidden=True`. `_sell`'s
  `_find_treasure_by_id` stays unscoped/unfiltered (sell is about ownership, not catalog
  visibility — unchanged, matches the "accept hidden treasure" section of the issue).
- `backend/games/views/game/_treasures.py::character_treasures` — when `npc=True`, also
  filter out treasures whose `GameTreasure.hidden` is `True` from the NPC's held-treasures
  list. Do **not** apply this filter when `npc=False` (a PC's own treasures list must keep
  showing everything it owns, per the issue). This is a *new*, separate filter from the
  existing `check_hidden`/`character.hidden` gate already in this function — don't conflate
  the two, even though today both happen to be `True` only for the `npc=True` call site.

### Step 4 — `hidden` field in the `treasures/all.json` payload

- Add a `hidden` field (via `GameTreasureFieldsMixin`-style `SerializerMethodField`
  resolving the context `GameTreasure` row's `hidden`, default `False` when no row exists)
  to a serializer used **only** by `game_treasures_all`
  (`backend/games/views/games/game_treasures_all.py`) — do not add it to the shared
  `TreasureListSerializer`/`TreasureDetailSerializer`, since those back the regular
  `treasures.json`/`treasure_detail.json` endpoints, which must keep omitting `hidden`
  entirely. A small subclass (e.g. `TreasureAllListSerializer` in
  `backend/games/serializers/treasures/`) mirroring `TreasureListSerializer` plus a
  `hidden` field is the simplest option.

### Step 5 — New DM-only endpoints

Follow the existing `GameEditPermission.check(request, game)` inline-authorization pattern
(see `game_treasures_all.py`) for all three:

- `GET /games/:slug/npcs/:id/treasures/all.json` — new view mirroring
  `backend/games/views/game/npcs/detail/treasures/game_npc_treasures.py` /
  `_treasures.py::character_treasures`, but skips the hidden-filter added in Step 3 and
  includes `hidden` per item (extend `CharacterTreasureSerializer` similarly to Step 4, or
  add a sibling serializer — same "don't leak onto the regular endpoint" constraint
  applies).
- `POST /games/:slug/pcs/:id/treasures/acquire/all.json` and `POST
  /games/:slug/npcs/:id/treasures/acquire/all.json` — new thin views mirroring
  `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire.py` /
  `game_npc_treasure_acquire.py`, calling into `_treasure_exchange.py` with a variant that
  skips the hidden-gate added in Step 3 (e.g. an `allow_hidden` flag threaded through
  `character_treasure_acquire`/`_find_game_treasure`), additionally gated by
  `GameEditPermission.check(request, game)` on top of the existing
  `CharacterEditPermission` check (a DM acting on behalf of any PC/NPC in their game, not
  just characters they'd otherwise be authorized to edit).
- Register all three in `backend/games/urls/npcs.py` / `backend/games/urls/pcs.py`,
  following the existing `treasures/all.json`-suffix naming convention already used by
  `games/urls/games.py:18` (`games/<slug>/treasures/all.json`) and
  `games/urls/npcs.py:9` (`games/<slug>/npcs/all.json`).

### Step 6 — Write path for `hidden` on exclusive treasures

- `TreasureCreateSerializer`/`TreasureUpdateSerializer`
  (`backend/games/serializers/treasures/`) drop `hidden` from `Meta.fields` (the model no
  longer has it).
- `backend/games/views/games/game_treasures.py::_create_game_treasure` — extract `hidden`
  from the request body (default `False`) before calling `serializer.save(...)`, and pass
  it into the existing `GameTreasure.objects.create(game=game, treasure=treasure,
  value=treasure.value, hidden=...)` call (line 92).
- `backend/games/views/games/game_treasure_detail.py::_update_exclusive_treasure` — same
  extraction, writing `hidden` onto the `GameTreasure.objects.filter(game=game,
  treasure=treasure).update(value=treasure.value, hidden=...)` call (line 79) only when
  `hidden` was present in the request body (partial update).
- `backend/games/views/treasures/treasure_detail.py` (the global `PATCH
  /treasures/<id>.json`, shared with staff/superuser edits of an exclusive treasure via
  `detail_or_update`) needs the same extraction/write when `treasure.game_id is not None`;
  when `treasure.game_id is None` (a truly global treasure), reject or silently drop
  `hidden` from the body (no game to scope it to) — pick whichever `treasure_update_test.py`
  conventions in this file already establish for ignored/no-op fields.

### Step 7 — Docs

Update `docs/agents/access-control/treasure.md` and
`docs/agents/access-control/game-treasure.md` to reflect the new field location, the new
per-game hidden semantics, the newly-added gating on acquire/npc-treasures-list, and the
three new endpoints.

## Files to Change

- `backend/games/models/treasure/treasure.py` — remove `hidden`
- `backend/games/models/game/game_treasure.py` — add `hidden`
- `backend/games/migrations/` — new add/backfill/remove migrations
- `backend/games/tests/factories.py` — move `hidden` from `TreasureFactory` to
  `GameTreasureFactory`
- `backend/games/views/games/game_treasures.py` — hidden filter via `GameTreasure`; create
  path writes `hidden` to `GameTreasure`
- `backend/games/views/games/game_treasure_detail.py` — hidden gate/cache-header via
  `GameTreasure`; update path writes `hidden` to `GameTreasure`
- `backend/games/views/games/game_treasures_all.py` — new `hidden`-including serializer
- `backend/games/views/treasures/treasure_detail.py` — global PATCH writes `hidden` to
  `GameTreasure` for exclusive treasures
- `backend/games/views/game/_treasure_exchange.py` — hidden-gate on acquire; `allow_hidden`
  variant for the new `/acquire/all.json` endpoints
- `backend/games/views/game/_treasures.py` — hidden-filter for NPC held-treasures list;
  `allow_hidden` variant for the new NPC `/treasures/all.json` endpoint
- `backend/games/views/game/pcs/detail/treasures/` and
  `backend/games/views/game/npcs/detail/treasures/` — new thin views for the three new
  endpoints
- `backend/games/urls/pcs.py`, `backend/games/urls/npcs.py` — new routes
- `backend/games/serializers/treasures/` — drop `hidden` from create/update; new
  `hidden`-including list serializer for `treasures/all.json`
- `backend/games/serializers/characters/character_treasure.py` (or a sibling) —
  `hidden`-including variant for the new NPC `/treasures/all.json` endpoint
- `docs/agents/access-control/treasure.md`, `docs/agents/access-control/game-treasure.md`
- Corresponding test files under `backend/games/tests/` mirroring every changed/added file
  above (models, migrations, serializers, views)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
  — covers the PC/NPC acquire/sell/treasures-list changes
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI
  job: `pytest_views_rest`) — covers `game_treasures`, `game_treasure_detail`,
  `treasures_list`, `treasure_detail`
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) —
  covers models, migrations, serializers, factories

## Notes

- Run inside the project containers per `AGENTS.md` (`docker-compose run --rm majora_tests
  pytest ...`), never directly on the host.
- Keep the `allow_hidden`/DM-bypass plumbing an explicit parameter rather than inferring it
  from `GameEditPermission` inside the shared `_treasure_exchange.py`/`_treasures.py`
  helpers, so the regular player-facing endpoints can't accidentally start bypassing the
  hidden gate for an editor calling them directly.
