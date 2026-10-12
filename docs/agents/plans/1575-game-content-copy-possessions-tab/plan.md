# Plan: Game content copy: Possessions tab

Issue: [1575-game-content-copy-possessions-tab.md](../../issues/1575-game-content-copy-possessions-tab.md)

## Overview
Add the `possessions` copy type to the staff copy page, following `docs/agents/specs/game-content-copy/possessions.md`. This tab works almost exactly like the merged Items tab (#1572 / #1583), and all the shared machinery is already in place (`ModelCopyType`, `CoverPhotoLinkBuilder`, the copy-link registry, `GameCharactersAvailableCachePaths`, the `StaffCopyRows` registry, the `copied_from` migration).

The backend adds the copy type, its row serializer and its cache paths, and attaches those cache paths to the existing `GamePossessionPhoto` copy-link entry. The frontend registers a row component that renders the same cells as the Items row.

No translator work is needed: the `staff_copies_page.types.possessions` tab label and every column key (`photo_column`, `name_column`, `hidden_column`, `hidden_badge`, `copied_to_target`) already exist in en and pt.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

Reviews after implementation: `data-access` and `security` (new list fields and a new copy endpoint through the generic dispatch), and `cache` (confirm the `X-Cache-Clear` paths and that no Navi resource is needed; staff copy endpoints send `X-Skip-Cache`).

## Shared contracts

`GET /staff/copies/possessions.json?from=<slug>&to=<slug>` returns a paginated list, ordered by `id`, of **every** possession of the source game, hidden ones included. Each row:

| Field | Type | Value |
|---|---|---|
| `id` | int | Source possession id |
| `name` | string | Source possession name |
| `hidden` | bool | Source `hidden` flag |
| `photo` | string \| null | Cover path when the cover is `ready`, else `null` |
| `copied_to_target` | bool | Whether a copy of this source already exists in the target game |

`POST /staff/copies/possessions/<id>.json` `{target}` uses the global `201 {id, links}` shape, with `links` holding 0 or 1 entry (the cover). `GET /staff/copies.json` `types` contains `possessions` as the **last** registered entry.

The frontend relies only on the row fields above. The slug is `possessions`.
