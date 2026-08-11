# Translator Plan: Grow STL model and create and show page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces every i18n key `frontend.md`'s components call via `Translator.t(...)`. Key names below
are the contract — do not rename once frontend starts wiring components against them; coordinate
here first if a name needs to change.

## Implementation Steps

### Step 1 — Extend `stl_model_page.yaml` (show page + shared value labels)

Add to both `frontend/assets/i18n/en/stl_model_page.yaml` and
`frontend/assets/i18n/pt/stl_model_page.yaml`:

```yaml
owned_label: Owned              # pt: Possuído
not_owned_label: Not owned      # pt: Não possuído (or reuse owned_label + a boolean badge; see frontend.md)
type_label: Type                # pt: Tipo
race_label: Race                # pt: Raça
role_label: Role                # pt: Função (or "Classe" — pick a natural pt term distinct from "class")
none_label: None                # pt: Nenhum(a) — used for the show page's "no race/role set" display

type_terrain: Terrain
type_prop: Prop
type_creature: Creature
type_other: Other

race_human: Human
race_elf: Elf
race_dwarf: Dwarf
race_halfling: Halfling
race_gnome: Gnome
race_half-elf: Half-Elf
race_half-orc: Half-Orc
race_tiefling: Tiefling
race_dragonborn: Dragonborn
race_orc: Orc
race_goblin: Goblin

role_barbarian: Barbarian
role_bard: Bard
role_cleric: Cleric
role_druid: Druid
role_fighter: Fighter
role_monk: Monk
role_paladin: Paladin
role_ranger: Ranger
role_rogue: Rogue
role_sorcerer: Sorcerer
role_warlock: Warlock
role_wizard: Wizard
role_archer: Archer
```

Portuguese file: same keys, translated values — see `docs/agents/i18n.md` for the YAML/
`Translator` mechanics and the sync-check script's expectations (keys must match exactly across
both locale files, verified by `npm run check_i18n`, CI job `frontend-checks`).

Use the exact `type_<value>`/`race_<value>`/`role_<value>` key suffixes from plan.md's `db_value`
list — `type`, `race`, `role`'s hardcoded frontend `<select>` options and the show page's label
lookup both key off `` `stl_model_page.${field}_${dbValue}` ``, so a mismatch here breaks either
the dropdown or the show page silently (falls back to the raw key string).

### Step 2 — Extend `stl_model_new_page.yaml` (full create page)

The file already exists (currently backs the modal). Reuse its existing keys (`title`, `name_label`,
`tags_label`, etc. — see current content) and add labels for the new fields' form inputs:

```yaml
owned_switch_label: Owned
type_select_label: Type
type_select_placeholder: Select a type
race_select_label: Race
race_select_none_option: None
role_select_label: Role
role_select_none_option: None
```

(Reuse `stl_model_page.type_label`/`race_label`/`role_label` instead if `frontend.md` decides the
new page's labels should be identical to the show page's — confirm with whichever key set
`frontend.md` actually ends up calling; adjust names here to match exactly once frontend is
implemented, since this file is written first but must stay in sync.)

### Step 3 — New `stl_model_edit_page.yaml`

New file, `frontend/assets/i18n/{en,pt}/stl_model_edit_page.yaml`, mirroring
`game_edit_page.yaml`'s shape (title, submit button, error message) — reuses the same field-level
labels as `stl_model_new_page.yaml` (same form fields, both create and edit).

```yaml
title: Edit STL Model
submit: Save
error: Something went wrong. Please try again.
```

(Adjust to match whatever field-error/status keys `game_edit_page.yaml` actually has — copy its
shape rather than reinventing it.)

### Step 4 — List/show page wording

`frontend/assets/i18n/{en,pt}/stl_model_page.yaml`: no title/heading changes needed beyond Step 1's
additions (existing `title`/`links`/`sources`/`collections`/`tags`/`loading` keys stay as-is); add
an `edit` key (e.g. `edit: Edit`) for the new "Edit" button/link on the show page.

`frontend/assets/i18n/{en,pt}/stl_models_page.yaml`: no changes expected — the "New STL model"
button's label (`new_stl_model`) already exists and still applies to the full-page entry point.

## Files to Change

- `frontend/assets/i18n/en/stl_model_page.yaml`, `frontend/assets/i18n/pt/stl_model_page.yaml`
- `frontend/assets/i18n/en/stl_model_new_page.yaml`, `frontend/assets/i18n/pt/stl_model_new_page.yaml`
- `frontend/assets/i18n/en/stl_model_edit_page.yaml`, `frontend/assets/i18n/pt/stl_model_edit_page.yaml` (new)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job `frontend-checks`)

## Notes

- Portuguese `role_label` wording: "role" maps awkwardly to Portuguese ("função"/"papel"), while
  "class" (avoided on the backend for the Python-reserved-word reason) would translate more
  naturally as "classe" — pick whichever reads best in-context; this is a translation judgment
  call, not a contract detail (only the English key *name* `role_label`/`role_<value>` is fixed).
- Coordinate the exact key names in Steps 2–3 with whoever implements `frontend.md` if they diverge
  from what's drafted here — this file is written first in dependency order (translator has no
  dependency on frontend/backend), so some naming may need a follow-up tweak once the frontend
  components are actually built against these keys.
