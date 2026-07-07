# Plan: Add search NPC and filters

Issue: [317-add-search-npc-and-filters.md](../issues/317-add-search-npc-and-filters.md)

## Overview

Add a filter/search bar to the game NPCs list page (`/#/games/:game_slug/npcs`) with a
"Status" (Alive/Slain) dropdown and a "Name" text search, wired through the URL query
params the same way pagination already is. Both NPC list endpoints
(`/games/:game_slug/npcs.json` and `/games/:game_slug/npcs/all.json`) gain matching
`slain`/`name` query-param filtering on the backend, and pagination links preserve the
active filters.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- Both `GET /games/:game_slug/npcs.json` (public) and `GET /games/:game_slug/npcs/all.json`
  (admin/DM) accept two new, optional, independent query params, applied in addition to the
  existing hardcoded filters (`npc=True, hidden=False` for the public endpoint; `npc=True`
  for the admin one):
  - `slain` — `"true"` or `"false"` (string). When present and equal to `"true"` or
    `"false"` (case-insensitive), filters on the `Character.slain` boolean field. Any other
    value (including absent/blank) means "no filter applied" — do not raise a 400, just
    ignore it.
  - `name` — free text. When present and non-blank, filters `Character.name` with
    case-insensitive substring match (`icontains`). Blank/absent means "no filter applied".
  - Existing pagination params (`page`, `per_page`) keep working unchanged and combine with
    the new filters (i.e. filters narrow the queryset before pagination is applied).
  - Response shape, headers (`page`/`pages`/`per_page`), and status codes are unchanged —
    only the queryset backing the paginated response changes.
- Frontend sends `slain` only when the Status dropdown is not blank (`"false"` for Alive,
  `"true"` for Slain) and `name` only when the Name field is non-blank. Both are read from /
  written to the hash URL query string alongside `page`/`per_page`, and are included in
  pagination links while active.
- New i18n keys (added by `translator`, consumed by `frontend`) live under the
  `game_npcs_page` namespace: `filter_status_label`, `filter_status_alive`,
  `filter_status_slain`, `filter_name_label`, `filter_name_placeholder`, `filter_query`,
  `filter_clear`.

## Notes

- `data-access` and `security` review are not required for this issue: no new endpoint,
  no new/removed serializer fields, no auth/permission/visibility change — the existing
  `hidden=False` / `GameEditPermission` gating is untouched; the new params only narrow an
  already-authorized queryset.
- `PaginationHelper`'s link template is currently hardcoded to `page`/`per_page`
  (`frontend/assets/js/components/elements/helpers/PaginationHelper.jsx`); it is extended to
  accept extra query params so pagination links preserve active filters. This helper is also
  used by other paginated pages (e.g. `GamePcs`) which do not pass filters — must remain
  backward compatible with no extra params.
