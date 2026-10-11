# Translator Plan: Game content copy: staff copy page

Main plan: [plan.md](plan.md)

## Shared contracts

### i18n keys (translator produces, frontend consumes)

New file `frontend/assets/i18n/<lang>/staff_copies_page.yaml` (en, pt), root key `staff_copies_page`:

| Key | en value (indicative) |
|---|---|
| `title` | Copy content |
| `loading` | Loading... |
| `error` | Failed to load. Please try again. |
| `source_label` / `target_label` | Source game / Target game |
| `select_placeholder` | Select a game |
| `same_game_error` | Source and target must be different games. |
| `select_games_hint` | Select a source and a target game. |
| `no_types` | No content types are available yet. |
| `empty` | There is nothing to copy in this game. |
| `types.items` / `types.common_items` / `types.recipes` / `types.documents` / `types.factions` / `types.possessions` | Items / Common items / Recipes / Documents / Factions / Possessions |
| `select_column` / `name_column` / `status_column` | Select / Name / Status |
| `select_all` | Select all on this page |
| `copied_to_target` | Already copied |
| `copy` | Copy selected |
| `retry` | Retry |
| `recopy_confirm_title` / `recopy_confirm_body` / `recopy_confirm_accept` / `recopy_confirm_cancel` | Copy again? / Some selected rows were already copied into the target game. Copying them again creates new, independent copies. / Copy again / Cancel |
| `entity_status.pending` / `.copying` / `.copied` / `.failed` | Pending / Copying... / Copied / Failed |
| `entity_error.not_found` / `.name_taken` / `.bad_request` / `.unknown` | Source no longer exists / Name already used in the target game / Invalid request / Copy failed |
| `progress` | `{{done}}` of `{{total}}` copied |
| `link_status.pending` / `.linking` / `.linked` / `.failed` | Pending / Linking... / Linked / Failed |
| `link_kind.image` / `.file` | Photo / File |
| `link_error.source_missing` / `.path_rejected` / `.cross_device` / `.target_exists` / `.permission` / `.unknown` | Source file missing / Path rejected / Different storage device / Target file already exists / Permission denied / Unknown error |
| `link_error.in_flight` | A link is already in progress (renew answered 409) |
| `links_title` | Pending and failed files |
| `links_empty` | No pending files. |
| `links_entity_column` / `links_kind_column` / `links_status_column` / `links_error_column` | Copied entry / Kind / Status / Error |

Plus `header.nav_staff_copies` ("Copy content") in `common.yaml`, next to `header.nav_staff_photos`.

Interpolation syntax: follow the existing convention in `frontend/assets/i18n` (check another `{{...}}` key). The frontend agent may add a key it finds missing, but must add it in **both** languages so `yarn check_i18n` passes.

## Implementation Steps

### Step 1 — Add the staff copies page strings
Create `staff_copies_page.yaml` for every language under `frontend/assets/i18n/` (currently `en` and `pt`) with every key in the table above, using `staff_photos_page.yaml` as the style reference. Write natural Portuguese translations, not literal ones.

### Step 2 — Add the menu label
Add `header.nav_staff_copies` to `common.yaml` in each language, right after `nav_staff_photos`.

## Files to Change
- `frontend/assets/i18n/en/staff_copies_page.yaml` — new.
- `frontend/assets/i18n/pt/staff_copies_page.yaml` — new.
- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml` — `header.nav_staff_copies`.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes
- Tab labels for all six slugs are added here on purpose, so the parallel tab issues (#1572–#1577) don't all edit the same block. Per-tab column labels stay with each tab issue.
