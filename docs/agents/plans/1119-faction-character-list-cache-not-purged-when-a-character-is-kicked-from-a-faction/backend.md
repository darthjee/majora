# Backend Plan: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the new endpoint shape (see [plan.md](plan.md#shared-contracts)):

- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove.json`
- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove/all.json`

`faction_id` comes from the URL only — the POST body no longer carries `game_faction_id`.
Response codes/behavior unchanged (`204` success, `404` under the same conditions as today).
Frontend depends on this shape; land together.

## Implementation Steps

### Step 1 — Add `faction_id` to the route path

In `backend/games/urls/_character_routes.py`, change the two `_CHARACTER_ROUTES` entries:

```python
('/factions/remove.json', 'faction_remove'),
('/factions/remove/all.json', 'faction_remove_all'),
```

to:

```python
('/factions/<int:faction_id>/remove.json', 'faction_remove'),
('/factions/<int:faction_id>/remove/all.json', 'faction_remove_all'),
```

`_character_route()` needs no change — it already interpolates `path_suffix` as-is after the
`<int:character_id>` prefix, so this alone produces the shared-contract URL shape for both PC and
NPC (`build_character_urlpatterns` is called once per kind). This mirrors the existing
`('/factions/<int:faction_id>.json', 'faction_detail')` convention already in the same list.

### Step 2 — Thread `faction_id` through the view builders

In `backend/games/views/game/_character_shared.py`, update `build_faction_remove_view` and
`build_faction_remove_all_view`: the inner `view(request, game_slug, character_id)` functions gain
a `faction_id` parameter (Django passes URL path converters as matching kwargs), and pass it through
to `character_faction_remove(...)`.

### Step 3 — Read `faction_id` from the URL instead of the body

In `backend/games/views/game/_faction_exchange.py`, update `character_faction_remove`:

- Add a `faction_id` parameter.
- Drop the `_FactionRemoveSerializer`/`validated_or_error` body-validation block entirely — there
  is no longer a body field to validate. Delete `_FactionRemoveSerializer` if nothing else
  references it (confirm — `_FactionAcquireSerializer` for the acquire endpoints is untouched and
  must stay).
- Look up the row directly: `character_faction = character.character_factions.filter(game_faction_id=faction_id).first()`.
- Keep the rest of the function (hidden gate, `404`, `delete()`, `204` response) unchanged.

### Step 4 — Update the access-control doc

In `docs/agents/access-control/character-faction.md`'s "Faction acquire (enlist) / remove (quit)
endpoints" table, update the `remove.json`/`remove/all.json` rows: the endpoint path now includes
`<faction_id>`, and the "Effect" column's "submitted `game_faction_id`" phrasing should read "the
`faction_id` in the URL" instead.

### Step 5 — Update tests

Update, for both PC and NPC, both remove and remove-all:

- `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_test.py`
- `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_all_test.py`
- `backend/games/tests/views/game/npcs/detail/factions/game_npc_faction_remove_test.py`
- `backend/games/tests/views/game/npcs/detail/factions/game_npc_faction_remove_all_test.py`

Each test's `reverse()` call needs a `faction_id` kwarg added (the `GameFaction`/enlisted id being
removed), and the POST body's `game_faction_id` key removed from request payloads. Cover: success
(`204`), unknown/unenlisted `faction_id` (`404`), hidden-and-not-allowed (`404`, remove-only), and
existing permission-tier tests — no new cases needed beyond adapting the request shape, since
behavior is otherwise identical.

## Files to Change

- `backend/games/urls/_character_routes.py` — add `<int:faction_id>` to the two remove route suffixes.
- `backend/games/views/game/_character_shared.py` — thread `faction_id` through `build_faction_remove_view`/`build_faction_remove_all_view`.
- `backend/games/views/game/_faction_exchange.py` — `character_faction_remove` reads `faction_id` from the URL, drops `_FactionRemoveSerializer`.
- `docs/agents/access-control/character-faction.md` — update the remove/remove-all endpoint rows.
- `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_test.py`
- `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_all_test.py`
- `backend/games/tests/views/game/npcs/detail/factions/game_npc_faction_remove_test.py`
- `backend/games/tests/views/game/npcs/detail/factions/game_npc_faction_remove_all_test.py`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`)

## Notes

- No other callers of `character_faction_remove`/`build_faction_remove_view` exist besides the PC/NPC
  route wiring itself — confirm during implementation that nothing else imports `_FactionRemoveSerializer`
  before deleting it.
- This is a breaking URL/body-shape change with no backward-compat window (internal API, single
  client) — land alongside the frontend change in the same PR.
