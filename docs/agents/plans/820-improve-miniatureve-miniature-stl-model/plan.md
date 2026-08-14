# Plan: Improve miniature/stl_model

Issue: [820-improve-miniatureve-miniature-stl-model.md](../../issues/820-improve-miniatureve-miniature-stl-model.md)

## Overview

Add `url` and `size` to `StlModel`, grow the `race` constant list from 11 to 29 values, and convert both `race` and `role` from single-value fields into arrays backed by two new join models (`StlModelRace`, `StlModelRole`), following the pattern used elsewhere in `miniatures` for multi-value fields. The create/edit form gets a new generalized picker component (constant-set search, no free-text creation) for races/roles plus plain fields for `url`/`size`; the show page displays all of it. Filters (#1107) and retrofitting URL validation onto other fields (#1108) are separate, split-off issues — not part of this plan.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Backend → Frontend (API surface)

`StlModel` request/response field names and shapes, replacing the current singular `race`/`role`:

- `url`: `string|null` — new, optional, unique, `http`/`https` only.
- `size`: `string|null` — new, optional, one of `SIZE_VALUES` (`tiny`, `small`, `medium`, `huge`, `gargantuan`, `life`).
- `races`: `string[]` — replaces `race`. Each entry is one of `RACE_VALUES` (29 values: the existing 11 plus 18 new ones — see issue for the full list and exact order). Optional, defaults to `[]`.
- `roles`: `string[]` — replaces `role`. Each entry is one of `ROLE_VALUES` (unchanged, 13 values). Optional, defaults to `[]`.

Applies to:
- `StlModelCreateSerializer` (POST body) and `StlModelUpdateSerializer` (PATCH body) — both accept `url`, `size`, `races`, `roles`.
- `StlModelDetailSerializer` (GET response) — returns `url`, `size`, `races`, `roles` alongside the existing fields.
- `StlModelListSerializer` is **unchanged** (`id`, `name`, `photo_url` only) — none of the new fields are exposed on the list endpoint; that's #1107's concern.

Backend owns validating `races`/`roles` entries against the constant choice lists (rejecting anything not in `RACE_VALUES`/`ROLE_VALUES`) and rejecting duplicate entries for the same stl_model (`unique_together`). Frontend's picker must independently constrain input to the same constant lists (`RACE_VALUES`/`ROLE_VALUES` in `stlModelEnums.js`), matching order/spelling exactly with backend's `RACE_CHOICES`/`ROLE_CHOICES` — the existing contract documented in `stlModelEnums.js`'s own docstring extends to the new `SIZE_VALUES` list too.

### Frontend → Translator (i18n keys)

Frontend needs new/changed keys in `stl_model_page.yaml` (show page) and `stl_model_new_page.yaml` (shared by new + edit forms) — see [frontend.md](frontend.md)'s "Files to Change" for the exact new UI pieces driving these. At minimum:

- `stl_model_page.yaml`: `url_label`, `size_label`, `size_tiny`/`size_small`/`size_medium`/`size_huge`/`size_gargantuan`/`size_life`, `races_label`, `roles_label`, and 18 new `race_<value>` keys (one per new race — see issue for the exact list; slugs are lowercase, no special characters except existing precedent like `race_half-elf`).
- `stl_model_new_page.yaml`: `url_label`, `url_placeholder`, `size_select_label`, `size_select_none_option`, plus whatever search-placeholder/remove-badge keys the new races/roles picker component ends up needing (frontend decides the exact key names when it builds the component and must pass the final list to translator — see [frontend.md](frontend.md) and [translator.md](translator.md)).

Both `en` and `pt` locales need every key; `npm run check_i18n` is the CI gate that catches drift.

## Notes

- Filters on `/#/miniatures/stl_models` and retrofitting URL validation onto `Collection.url`/`Source.url` are explicitly out of scope — tracked as [#1107](https://github.com/darthjee/majora/issues/1107) and [#1108](https://github.com/darthjee/majora/issues/1108) respectively.
- No external API consumers beyond the bundled frontend — the `race`/`role` → `races`/`roles` rename is a breaking change made safely in one atomic deploy.
- Existing `HistoricalStlModel` records for `race`/`role` are dropped (not migrated) when those columns are removed from the historical table — an accepted, deliberate loss.
