# Issue: Add "Common Items" entry to the Game menu

## Description
Common items (`GameCommonItem`, a game's priced catalog of potions, drugs, ammunition, gear and so on) already have full frontend pages for list, new, show and edit (`frontend/assets/js/components/resources/common_item/pages/`). Their routes are registered in `HashRouteResolver.js` (`#/games/:game_slug/common_items[/new|/:id|/:id/edit]`). The header's **Game** dropdown has no entry for them, though, and nothing else links to the list page.

## Problem
The only way to reach `#/games/:game_slug/common_items` today is to type the URL. Every other game-scoped catalog (Items, Possessions, Factions, Documents) has an entry in the Game dropdown.

## Expected Behavior
- On any game page, the Game dropdown shows **Common Items** right after **Items**, linking to `#/games/<slug>/common_items`.
- The label is translated: `Common Items` (en) and `Itens Comuns` (pt).
- The entry has the same audience as Items (anyone on a game page, logged-out visitors included). What each person sees on the list page (hidden entries, the create button) is already handled by the page.

## Solution
- **Menu entry:** in `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`, add to `NAV_LINK_REGISTRY`, right after the `items` entry:
  `gameItem('common-items', '/common_items', 'game_page.common_items')`
  It uses the default `IS_GAME_PAGE` rule, the same as Items and Possessions.
- **i18n:** add `common_items` under `game_page` in `frontend/assets/i18n/en/game_page.yaml` (`Common Items`) and `frontend/assets/i18n/pt/game_page.yaml` (`Itens Comuns`).
- **Specs:** update `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/gameNavLinksSpec.js`. Its order test ("renders items in Show/PCs/NPCs/Treasures/Items/…") should expect `#/games/epic-quest/common_items` between `/items` and `/possessions`, and its title should mention Common Items.

### Permissions
Common items already have exactly the same permissions as `GameItem`, on both the backend and the frontend. No permission changes are needed.

| Action | Endpoint | Who |
|---|---|---|
| List visible | `GET /games/:slug/common_items.json` | Anyone, including logged-out visitors (`AllowAny`); hidden entries filtered out |
| List all, including hidden | `GET …/common_items/all.json` | DM(s) of the game, admins |
| Show visible | `GET …/common_items/:id.json` | Anyone; hidden entries return 404 |
| Show any, including hidden | `GET …/common_items/:id/full.json` | DM(s) of the game, admins |
| Create / edit / photo upload | `POST` list, `PATCH` detail, `photo_upload` | DM(s), admins, staff, any player of the game |

- Backend: `backend/permissions/config/game_common_item/{endpoints,ui}.yml` match `game_item/*.yml` apart from comments, and the list, all, detail and full views match their `game_item*` counterparts.
- Frontend: `RequestPermissionResolvers.js`'s `commonItem.collection`/`single` choose the regular or `all`/`full` endpoint via the game-level `AccessStore.ensureGamePermissions`, like `item`'s `'game'` kind. The list page's "New" button is shown on `can_create_common_item`, like Items uses `can_create_item`.

### Out of scope
- No new pages, routes, backend endpoints or permission changes.
- No link or preview on the game show page.

### Acceptance criteria
- The Game dropdown shows Common Items right after Items, with the correct href.
- The translation-key sync check passes for en and pt.
- Frontend specs and lint pass.

## Benefits
Common items become discoverable from the UI, consistent with every other game catalog in the Game menu.
