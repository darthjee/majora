# Plan: Game content copy: Common items tab

Issue: [1573-game-content-copy-common-items-tab.md](../../issues/1573-game-content-copy-common-items-tab.md)

## Overview
Add the `common_items` copy type to the staff copy page, following the merged Items tab
(#1572) pattern. The backend registers a `CommonItemsCopyType` (list + transactional copy +
cover link) right after `items`, and plugs the common-item cache paths into the
`GameCommonItemPhoto` copy link. The frontend registers a `StaffCopyCommonItemRow`. The
translator adds the two new column header keys. Spec: `docs/agents/specs/game-content-copy/common-items.md`.

## Agents involved

- [backend](backend.md)
- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

`GET /staff/copies/common_items.json?from=<slug>&to=<slug>`: paginated (same headers as the
items list), ordered by `id`, hidden rows included. Each row:

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Source common item id. |
| `name` | string | |
| `category` | string | Raw choice value: `potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`, `other`. |
| `price` | integer | |
| `hidden` | boolean | |
| `photo` | string \| null | Cover path, only when the cover is `ready`. |
| `copied_to_target` | boolean | Shared status cell already renders it. |

`POST /staff/copies/common_items/<id>.json {target}`: global `201 {id, links}` with 0 or 1
link (the cover, `kind` image). No tab-specific error codes (name clashes are allowed).

`GET /staff/copies.json` lists `common_items` second, right after `items`.

New i18n keys (en + pt), in `frontend/assets/i18n/<lang>/staff_copies_page.yaml`:
- `staff_copies_page.category_column`: "Category" / "Categoria"
- `staff_copies_page.price_column`: "Price" / "Preço"

Category values are translated with the existing `common_item_page.category.<value>` keys.
