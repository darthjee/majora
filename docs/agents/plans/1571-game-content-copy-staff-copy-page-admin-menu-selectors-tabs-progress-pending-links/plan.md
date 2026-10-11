# Plan: Game content copy: staff copy page (Admin menu, selectors, tabs, progress, pending links)

Issue: [1571-game-content-copy-staff-copy-page-admin-menu-selectors-tabs-progress-pending-links.md](../../issues/1571-game-content-copy-staff-copy-page-admin-menu-selectors-tabs-progress-pending-links.md)

## Overview
Build the staff-only `#/staff/copies` page on top of the backend copy API that #1568, #1569 and #1570 already merged. The page has the Admin menu entry, source/target selectors kept in the URL, tabs from `staff/copies.json` with an empty state, and a generic paginated source list with a slug → row-component registry (ships empty, with a generic fallback row). It runs copies sequentially (copy request, then one proxy link request per file) with progress, and lists pending/failed links with retry. The `translator` adds every UI string, including the six tab labels, in all languages.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Backend API (already merged, consumed by frontend)

All staff-only, `.json`, `X-Skip-Cache`:

- `GET /staff/copies.json` → `{types: string[]}`. **Empty today** (`backend/staff/copy_types.py` registry ships empty).
- `GET /staff/copies/games.json` → `[{slug, name, domain_groups: string[]}]`. Not paginated.
- `GET /staff/copies/<type>.json?from=<slug>&to=<slug>&page=&per_page=` → paginated rows; each row has at least `id`, `name`, `copied_to_target` (factions also `name_taken_in_target`). `400` for a missing/unknown/same game, `404` for an unknown type.
- `POST /staff/copies/<type>/<id>.json` `{target: <slug>}` → `201 {id, links: [{upload_id, upload_type, token}]}`; `400`, `404` (source gone/unknown type), `422` (e.g. name taken).
- `GET /staff/copies/links.json?to=<slug>` → `[{upload_id, upload_type, status, error, entity: {type, id, name, kind, game}}]`. Not paginated.
- `POST /staff/copies/links/<upload_id>/renew.json` → `{upload_id, upload_type, token}`; `404` gone, `409` link in flight.
- Proxy: `POST /uploads/link/<image|file>/<upload_id>/submit` with header `X-Upload-Token: <token>`, no body. `404` means the copied row or game was deleted.

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
