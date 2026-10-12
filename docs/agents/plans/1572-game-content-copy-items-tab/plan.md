# Plan: Game content copy: Items tab

Issue: [1572-game-content-copy-items-tab.md](../../issues/1572-game-content-copy-items-tab.md)

## Overview
Plug the **Items** tab into the merged game-content-copy machinery (#1568–#1571): an `items`
`CopyType` (list + transactional copy with an optional cover link), the `GameItemPhoto`
copy-link `cache_paths` hook, and a registered frontend row. Because Items is the reference
implementation for #1573–#1577, the backend first builds reusable helpers (copy-type
scaffolding, cover-photo link builder, character `available.json` cache paths) and the items
entry is their first caller. Spec: `docs/agents/specs/game-content-copy/items.md`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

Reviews after implementation: `data-access`, `security`; `cache` confirms the `X-Cache-Clear`
paths and that no Navi resource is needed (every `staff/copies` endpoint is `X-Skip-Cache`).

## Shared contracts

`GET /staff/copies.json` → `{"types": ["items", ...]}` — `items` is first.

`GET /staff/copies/items.json?from=<slug>&to=<slug>` — paginated (standard `Paginator`
headers), ordered by `id`, every item of `from` (hidden included). Each row:

| Field | Type | Notes |
|---|---|---|
| `id` | int | Source `GameItem` id. |
| `name` | string | |
| `hidden` | bool | |
| `photo` | string \| null | Cover `GameItemPhoto.path` (e.g. `photos/games/<slug>/items/<id>/photo.png`) when the cover is `ready`, else `null`. |
| `copied_to_target` | bool | Some item of `to` has `copied_from` = this row. |

`copied_from` is never serialized.

`POST /staff/copies/items/<id>.json` `{"target": "<slug>"}` → `201`
`{"id": <copy id>, "links": [{"upload_id": int, "upload_type": "image", "token": string}]}`
(0 or 1 link), plus `X-Cache-Clear`. Errors are the existing dispatch ones (`400`/`404`); never
`422` for items.

Frontend: `StaffCopyRows.register('items', StaffCopyItemRow, [<column header keys>])`; the row
receives `{ row, selected, onToggle }` and renders only its own `<td>` cells (thumbnail, name,
hidden badge). The translator provides the header/badge keys under `staff_copies_page`, agreed
names:

- `staff_copies_page.photo_column` — "Photo"
- `staff_copies_page.hidden_column` — "Visibility"
- `staff_copies_page.hidden_badge` — "Hidden"
