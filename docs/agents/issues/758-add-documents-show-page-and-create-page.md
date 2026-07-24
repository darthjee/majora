# Issue: Add documents show page and create page

## Description
`GameDocument` (and its companion `GameDocumentPhoto`) already exist as a model, with a public list endpoint (`GET /games/:game_slug/documents.json`) and a DM/admin-only list endpoint (`GET /games/:game_slug/documents/all.json`). Today the feature is entirely read-only: there is no detail/show endpoint, no create endpoint, and the frontend documents list page renders cards with no link to a show page (`buildDocumentHref` currently always returns `null`).

This issue closes that gap by adding a create flow and a show flow for `GameDocument`, mirroring the `GameItem` game-level creation feature just merged (issue #784, PR #822) for the create side, and the equivalent detail-endpoint pattern (`GameItemDetailSerializer` / `GameItemDetailFullSerializer`, `game_item_detail.py` / `game_item_detail_full.py`) for the show side.

## Problem
There is no way to create a `GameDocument`, and no way to view a single document's details (including its description, which is deliberately omitted from the existing list endpoints).

## Solution
This mirrors the `GameItem` game-level creation feature just merged (issue #784, PR #822), adapted for `GameDocument` (no photo upload for now):

- Add a create document page `/#/game/:game_slug/documents/new`
- Add a create document endpoint: `POST /games/:game_slug/documents.json` (shares the existing `documents.json` route, method-dispatched alongside the existing `GET`, mirroring how `game_items` now handles both `GET`/`POST`)
- Add a show document page `/#/game/:game_slug/documents/:id`
- Add a public show document endpoint `GET /games/:game_slug/documents/:id.json`
- Add a restricted show document endpoint `GET /games/:game_slug/documents/:id/full.json`
- Add a `can_create_document` field to `GET /games/:game_slug/permissions.json` (`GamePermissionsSerializer`), backed by the new create permission, for both the real-identity and role-simulated (`?role=`) paths — mirrors `can_create_item`
- On `/#/game/:game_slug/documents`, add a "Create documents" button, gated on `can_create_document` (fetched via `AccessStore.ensureGamePermissions`, independent of `ListPage`'s `canEdit`) — mirrors `GameItemsHelper`/`GameItemsController`
- On `/#/game/:game_slug/documents`, make document cards link to the show page — update `buildDocumentHref` in `documentListTypes.js` to build a link (currently always returns `null`), following the same `stretched-link`-on-title pattern items use

### Pages

#### `/#/game/:game_slug/documents/new`
Form to create a new document: `name` (text), `description` (textarea), `hidden` (switch) fields — mirrors `GameItemNew`'s form minus the photo picker (no photo upload for now; the `photo` FK/`GameDocumentPhoto` model exists as schema only and stays out of scope).

#### `/#/game/:game_slug/documents/:id`
Shows the document's `name`, `description`, and photo (if/when set). Modeled after the item show page layout (`ShowPageLayout`). No edit or delete action in this issue — those remain out of scope, to be delivered as follow-up issues (as happened for items).

### Endpoints

#### `POST /games/:game_slug/documents.json`
Creates a bare `GameDocument` for the game — no owning `CharacterDocument` is created (documents have no character-linked equivalent yet). Request body: `{ name: string, description?: string, hidden?: boolean }` (`name` required ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`). Returns `201` with the detail-full shape (`GameDocumentDetailFullSerializer`).

#### `GET /games/:game_slug/documents/:id.json`
Public. Returns a document that is not hidden (hidden returns 404). Does not include the `hidden` attribute. New `GameDocumentDetailSerializer` (adds `description` to the existing list shape).

#### `GET /games/:game_slug/documents/:id/full.json`
Restricted. Returns a document even if hidden, and includes the `hidden` attribute. New `GameDocumentDetailFullSerializer`, gated by `GameEditPermission` (same class already used by `documents/all.json`), sets `X-Skip-Cache: true` like the other "full"/"all" document and item endpoints.

### Permissions

#### New pages
Everyone can navigate to `/documents/new` and `/documents/:id`; enforcement happens at the API layer (the create form is reachable by anyone, but submission is rejected per the rule below).

#### `POST /games/:game_slug/documents.json`
DM, admin (superuser), and staff — via a new `GameDocumentCreatePermission`, mirroring the just-merged `GameItemCreatePermission` exactly (`user.is_staff or game.can_be_edited_by(user)`). **Note:** this corrects the original issue text ("for players, dm, staff and admin") — the newly-established item-creation precedent does *not* include plain players (no owning-character concept for a bare game-level entity), so documents follow suit for consistency.

#### `GET /games/:game_slug/documents/:id.json`
Everyone (`AllowAny`), excluding hidden documents.

#### `GET /games/:game_slug/documents/:id/full.json`
DM and admin (superuser) only — `GameEditPermission`, matching the existing `documents/all.json` and `items/:id/full.json` endpoints. Staff is intentionally excluded here (even though it's included in create), consistent with `Game.can_be_edited_by` and the equivalent item endpoint.
