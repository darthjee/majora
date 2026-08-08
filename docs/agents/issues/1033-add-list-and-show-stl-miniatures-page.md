# Issue: Add list and show STL miniatures page

## Description
Add frontend pages to list and show STL miniature models, backed by the existing `/miniatures/stl_models.json` (list) and `/miniatures/stl_models/<id>.json` (detail) API endpoints.

## Problem
The `stl_models` endpoints exist on the backend, but there is no frontend way to browse or view them — no index page, no show page, and no header link to reach them.

## Expected Behavior
- Logged-in users see a "STL Models" link in the header, positioned between "Games" and "Admin", pointing to the index page `/#/miniatures/stl_models.json`. The link is hidden for logged-out users.
- The index page (`/#/miniatures/stl_models.json`) lists STL models with pagination and pictures, matching the look/behavior of other resource index pages (e.g. treasures).
- The show page (`/#/miniatures/stl_models/<id>.json`) displays a single STL model's full detail: `name`, `photo_url` (picture), `links`, `sources`, and `tags` — matching everything the detail serializer returns, not just name + picture.
- Both endpoints already require `IsAuthenticated`; the pages are only reachable/useful for logged-in users.

## Solution
FE-only work, mirroring the "treasures" resource pattern (closest existing index+show+pagination+picture example):
- Index: new page analogous to `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx` (+ `TreasuresHelper.jsx`), using the shared `ListPage` (`frontend/assets/js/components/common/list_page/ListPage.jsx`) with a list-type config analogous to `frontend/assets/js/components/common/list_types/configs/globalTreasureListType.js`.
- Show: new page analogous to `frontend/assets/js/components/resources/treasure/pages/Treasure.jsx` + `controllers/TreasureController.js` + `helpers/TreasureHelper.jsx`, rendering `name`, `photo_url`, `links`, `sources`, and `tags` from `StlModelDetailSerializer`.
- resourceStore: `frontend/assets/js/utils/requests/RequestStore.js` driven by a new per-resource config file (`stlModelConfig.js`), following the shape of `frontend/assets/js/utils/requests/config/treasureConfig.js` — but read-only (GET collection + GET single only), since the `stl_models` endpoints only expose list/detail, unlike treasures' full CRUD config.
- Pagination: reuse `frontend/assets/js/components/common/pagination/` (`Pagination.jsx`, `PaginationController.js`, `BrowsePager.jsx`).
- Header link: reuse the header's existing `loggedIn` state (already populated from `GET /users/status.json`) — no new endpoint or dedicated permission field needed. This is new code, not a literal mirror of an existing pattern: today `loggedIn` only gates the login/logout dropdown in `HeaderHelper.jsx`'s `renderAuthControl`, while the other conditional nav links (Admin, Game, Character in `HeaderNavHelper.jsx`) gate on `isSuperUser`/`isStaff`/route context instead. Add a plain `Nav.Link` conditionally rendered when `state.loggedIn` is true, placed in `HeaderHelper.jsx` between the existing "Games" `Nav.Link` and the Admin dropdown call.
- Cache warmer: add `navi/resources/stl_models.yml` and register it in `navi/navi_config.yaml`, since no cache config currently exists for these endpoints and this issue is the first FE consumer of them (keeps the cache config in sync with the API surface, per repo convention).
- No Django backend changes: the `stl_models` list/detail endpoints, serializers, `IsAuthenticated` permission, and pagination already exist and are used as-is (`backend/miniatures/views/stl_models_list.py`, `stl_model_detail.py`, `backend/miniatures/urls/stl_models.py`).
