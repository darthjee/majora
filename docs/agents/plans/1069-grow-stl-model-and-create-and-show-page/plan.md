# Plan: Grow STL model and create and show page

Issue: [1069-grow-stl-model-and-create-and-show-page.md](https://github.com/darthjee/majora/issues/1069)

## Overview

`StlModel` gains four new fields (`owned`, `type`, `race`, `role`) plus a backend update
endpoint, and its creation UI moves from a modal back to a full page that also supports editing.
`race`/`role` are plain closed-list enum fields (D&D 5e races/classes), not separate DB entities —
same shape as the existing `type` field, not a `Source`-style catalog resource. The work splits
cleanly across three specialists: backend (model/serializers/views/migration), frontend
(page/route/components), and translator (new i18n keys for the new fields' labels/values).

## Agents involved

- [backend](backend.md)
- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

### New `StlModel` fields (backend produces, frontend/translator consume)

| field | type | nullable | default | values |
| --- | --- | --- | --- | --- |
| `owned` | boolean | no | `true` | — |
| `type` | string (choices) | no | none (required) | `terrain`, `prop`, `creature`, `other` |
| `race` | string (choices) | yes | `null` | `human`, `elf`, `dwarf`, `halfling`, `gnome`, `half-elf`, `half-orc`, `tiefling`, `dragonborn`, `orc`, `goblin` |
| `role` | string (choices) | yes | `null` | `barbarian`, `bard`, `cleric`, `druid`, `fighter`, `monk`, `paladin`, `ranger`, `rogue`, `sorcerer`, `warlock`, `wizard`, `archer` |

These exact `db_value` strings are the contract: backend's `RACE_CHOICES`/`ROLE_CHOICES`/
`TYPE_CHOICES` constants, frontend's hardcoded `<select>` option values, and translator's i18n
keys must all agree on this list verbatim. `race`/`role` dropdowns need a blank/"None" option
mapping to `null` (no `db_value` of its own).

### API surface (backend produces, frontend consumes)

- `StlModelCreateSerializer` (`POST /miniatures/stl_models.json`) gains `owned` (optional,
  default `true`), `type` (required), `race` (optional, nullable), `role` (optional, nullable).
- `StlModelDetailSerializer` (`GET`/`PATCH` responses) gains `owned`, `type`, `race`, `role`.
- New endpoint: `PATCH /miniatures/stl_models/<id>.json` — partial update, `require_staff`-gated
  (same tier as create), returns the `StlModelDetailSerializer` shape. Accepts any subset of
  `name`, `owned`, `type`, `race`, `role` (photo/tags/sources/collections stay out of scope for
  this update endpoint — they already have their own dedicated flows: photo upload endpoint,
  and no existing UI/need to change tags/sources/collections from the edit page per this issue).
- 400 on an unknown `race`/`role`/`type` value or a `type` explicitly set to `null`/omitted on
  create; 401/403 follow the existing `require_staff` shape used by create.

### i18n keys (translator produces, frontend consumes)

- `stl_model_new_page.*` — reused/extended for the new full create page (already exists for the
  modal; keys mostly carry over, plus new ones for the new fields).
- `stl_model_edit_page.*` — new file, mirroring `game_edit_page.yaml`'s shape, for the edit page's
  own title/submit/labels.
- `stl_model_page.*` — extended with `type_<value>`, `race_<value>`, `role_<value>` (one key per
  `db_value` above) and an `owned`/`none` label, for the show page's translated display and reused
  by both form pages' `<select>` labels.
- Exact key names are finalized in [translator.md](translator.md); frontend components reference
  them via `Translator.t(...)` exactly as named there.
