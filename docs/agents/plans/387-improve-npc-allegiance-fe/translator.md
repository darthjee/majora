# Translator Plan: Improve NPC allegiance FE

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<namespace>.<key>')` for every
new label introduced by this issue, using the exact key names below. Add
them to every existing locale file under `frontend/assets/i18n/` (currently
`en.yaml` and `pt.yaml`) so `npm run check_i18n` (key-parity check) keeps
passing.

## Implementation Steps

### Step 1 — Add keys to `game_npc_new_page` (NPC creation form)

`en.yaml`, inside the existing `game_npc_new_page:` block (after
`hidden_label`, before `money_label`, or wherever reads best next to the
other field labels):
```yaml
allegiance_label: Allegiance
public_allegiance_label: Public Allegiance
allegiance_ally: Ally
allegiance_enemy: Enemy
allegiance_neutral: Neutral
```

`pt.yaml`, same block:
```yaml
allegiance_label: Facção
public_allegiance_label: Facção Pública
allegiance_ally: Aliado
allegiance_enemy: Inimigo
allegiance_neutral: Neutro
```

### Step 2 — Add the same keys to `npc_edit_page` (NPC edit form)

Identical five keys/values as Step 1, added to the existing
`npc_edit_page:` block in both `en.yaml` and `pt.yaml` (after
`private_description_label`, before `money_label`, or wherever reads best).
Do **not** add these to `pc_edit_page` — allegiance is NPC-only, per the
issue and `frontend.md`'s gating plan.

### Step 3 — Add filter keys to `game_npcs_page` (NPC index filter)

`en.yaml`, inside the existing `game_npcs_page:` block, next to the
`filter_status_*` keys:
```yaml
filter_allegiance_label: Allegiance
filter_allegiance_ally: Ally
filter_allegiance_enemy: Enemy
filter_allegiance_neutral: Neutral
```

`pt.yaml`, same block:
```yaml
filter_allegiance_label: Facção
filter_allegiance_ally: Aliado
filter_allegiance_enemy: Inimigo
filter_allegiance_neutral: Neutro
```

### Step 4 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the keys above to `game_npc_new_page`,
  `npc_edit_page`, and `game_npcs_page`
- `frontend/assets/i18n/pt.yaml` — same, translated

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- These key names are the source of truth for the `frontend` agent's
  `Translator.t()` calls — if implementation needs different names, update
  this file and `plan.md`'s "Shared contracts" section in lockstep.
- `allegiance_ally`/`allegiance_enemy`/`allegiance_neutral` are intentionally
  identical strings in both `game_npc_new_page` and `npc_edit_page` (rather
  than a single shared namespace) to match this codebase's existing
  convention of per-page namespaces with duplicated common labels (e.g.
  `name_label`/`role_label`/`money_label` are already duplicated across
  `pc_edit_page`/`npc_edit_page`/`game_npc_new_page` today).
