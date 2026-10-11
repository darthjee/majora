# Issue: Game content copy: staff copy page (Admin menu, selectors, tabs, progress, pending links)

## Description
Part of "copy content between games" (epic #1550): the staff-only frontend page, without any tab-specific rows (each tab issue, #1572–#1577, adds its own).

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. Implements `page.md` and the frontend part of `permissions.md`.

## Problem
The backend copy API is in place (#1568, #1569, #1570 merged), but staff have no UI to use it. The backend copy-type registry (`backend/staff/copy_types.py`) ships empty: until the tab issues land, `GET staff/copies.json` returns `{"types": []}`, and the per-type list and copy endpoints reject every slug. The page must work in that state and let each tab plug in later without changing the shared page.

## Expected Behavior
- New `adminItem` in `HeaderNavHelper` under the **Admin** menu (`IS_ADMIN` gate, like `staff/photos`).
- Route `#/staff/copies?type=<tab>&from=<slug>&to=<slug>`, `staffCopy` resource config and `staffCopies` page controller gated on `AccessStore.ensureStaffOrSuperUser()`; reload/share restores state.
- Source and target selectors fed by `GET staff/copies/games.json` (name + domain groups); same game for both rejected client-side.
- Tabs from `GET staff/copies.json`, modeled on `StaffPhotoTabs`, keeping `from`/`to` in tab links; `type` defaults to the first tab.
- **Empty registry**: when `types` is empty, the tab area shows a translated "no content types available" message; selectors and the pending-links list still render and work.
- Generic source list (`GET staff/copies/<type>.json`, paginated, checkboxes, select-all, `copied_to_target` flag with re-copy confirmation).
- **Row plug-in**: a frontend slug → row-component registry, mirroring the backend `copy_types` registry and **shipping empty**; each tab issue registers its row component there. A slug returned by the backend with no registered row renders a generic fallback row (checkbox, name, `copied_to_target` flag), so frontend/backend drift never breaks the page.
- Sequential execution: `POST staff/copies/<type>/<id>.json` per entity, then `POST /uploads/link/<image|file>/<upload_id>/submit` per link (new `UploadClient` method); per-entity and per-file progress; failures never stop the run; `404` refreshes the list.
- Pending/failed links list (`GET staff/copies/links.json?to=`) with translated error reasons and retry (`renew.json`, then the link request); `404` drops the row.
- i18n keys in all languages: menu, page, selectors, empty-tabs message, actions, confirmation, statuses, one label per link `error` code, and the **tab labels for all six slugs** (`items`, `common_items`, `recipes`, `documents`, `factions`, `possessions`), so the parallel tab issues do not all edit the same translation block.

## Solution
- Agents: `frontend`, `translator`.
- Jasmine specs: controller staff gate, selectors and URL state, tabs (including the empty-types state), source list with a registered row and with the fallback row, progress, re-copy confirmation, pending-links list and retry.

### Depends on
#1568, #1569, #1570 — all merged.

## Benefits
Gives staff the page every tab plugs into; tab issues only register a row component and a backend registry entry.
