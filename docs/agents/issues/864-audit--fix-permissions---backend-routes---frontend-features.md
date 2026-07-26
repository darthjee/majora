# Issue: [AUDIT] Fix Permissions - Backend Routes & Frontend Features

## Description
Comprehensive audit of backend route permissions and frontend feature-level gating across the app, verified against a policy shift that gives players more power to create and update content collaboratively while still protecting private/hidden information. This issue tracks the audit itself; items that require new functionality (not just re-wiring an existing permission check) are split off into their own dedicated issues as they're picked up:
- #865 (delivered via PR #867) already split off PC's reduced-field regular update from its DM/owner-only full update.
- #868 splits off NPC creation the same way (a player-safe regular endpoint vs. a DM/admin-only full endpoint), since a bare permission swap on today's single `POST .../npcs.json` would let a player-created NPC set `hidden`/`private_*` fields.

During review, most items originally marked `[ ]` (incorrect) in the backend checklist were verified against the actual code and the authoritative `docs/agents/access-control/` doc set and turned out to already be correctly implemented — the checklist itself was stale/drafted ahead of the code. A few duplicate/contradictory lines (the same route listed twice with conflicting checkbox states) and two bogus routes (referencing a `PATCH .../items/:id/full.json` that doesn't exist) were also found and cleaned up. `[x]` below means confirmed correct as of this review; `[ ]` means a confirmed, real gap.

Player self-service PC creation (`POST /games/<slug>/pcs.json`) was identified as a gap during discussion but is explicitly **deferred**: the endpoint doesn't exist in the codebase today, and it needs more scoping before it becomes its own issue.

## Problem
This is part of a broader change in policy: giving players more power to edit and create entries, without letting them see or change restricted information, so the game's content becomes more collaborative.

- Players should have access to regular update endpoints.
- Players should not have access to private endpoints (`hidden` entries, or `private_*` attributes), but they should be able to create new entities or update non-sensitive information on entities of games they're part of.
- Players should not be able to update the game itself.
- Players should not be able to update game treasures (planned for a future issue).
- Players should not be able to create game treasures (planned for a future issue).
- Players should have no access to game tasks.

Examples:
- A player should be able to update a PC they do not own, just not its `private_*` attributes.
- A player should be able to update an NPC to help the DM, just not `hidden` NPCs nor `private_*` attributes.
- A player should be able to create an NPC to help the DM, just not `hidden` NPCs nor `private_*` attributes.

`[x]` marks an item confirmed correct; `[ ]` marks an item confirmed incorrect and needing a fix.

## Solution

### Backend Routes Permissions

#### Superuser Only
- [x] `DELETE /games/<slug>` - confirmed no `DELETE` method is registered on this route anywhere in the codebase; nothing to remove.
- [x] `DELETE /treasures/<id>` - confirmed no `DELETE` method is registered on this route anywhere in the codebase; nothing to remove.

#### Superuser & Staff
- [x] `POST /users/test-email.json` - Staff-or-superuser
- [x] `GET /treasures` (global treasure list) - Staff-or-superuser
- [x] `POST /treasures` (global treasure create) - Staff-or-superuser
- [x] `PATCH /treasures/<id>` (global treasure update) - Staff-or-superuser

#### Superuser & Game Masters
- [x] `POST /games/<slug>/tasks.json` - TaskEditPermission (already superuser/DM-only)
- [x] `PATCH /games/<slug>/tasks/<id>.json` - TaskEditPermission (already superuser/DM-only)
- [x] `GET /games/<slug>/items/all.json` - GameEditPermission
- [x] `PATCH /games/<slug>/items/:id/full.json` - GameEditPermission
- [x] `GET/PATCH /games/<slug>/treasures/<treasure_id>.json` (game-scoped treasure detail; there is no separate `treasures/:id/full.json` route) - GameEditPermission
- [x] `GET /games/<slug>/documents/all.json` - GameEditPermission
- [x] `PATCH /games/<slug>/documents/:id/full.json` - GameEditPermission
- [x] `GET /games/<slug>/npcs/<id>/documents/all.json` - Restricted character documents details - GameEditPermission
- [x] `GET /games/<slug>/npcs/<id>/full.json` - Restricted character detail
- [x] `PATCH /games/<slug>/npcs/<id>/full.json` - CharacterEdit (superuser/DM-only for NPCs - no owner concept - already matches this bucket; a duplicate previously also listed here under a `[ ]` was a stray copy of this same route and has been removed)
- [x] `GET /games/<slug>/npcs/<id>/treasures/all.json` - Restricted character treasures detail
- [x] `GET /games/<slug>/npcs/<id>/items/all.json`
- [ ] `POST /games/<slug>/npcs/<id>/items/<item_id>/photo_upload.json` - CharacterItemPhotoUploadPermission currently also grants Staff; needs a narrower NPC-specific permission (superuser/DM only, no staff bypass) split out from the shared class

(Two more `[ ]` lines previously listed here — `PATCH .../npcs/<id>/items/:id/full.json` and, under the Character-Owner bucket below, `PATCH .../pcs/<id>/items/:id/full.json` — were removed: no `PATCH` method exists on either route today, only `GET`. They were mislabeled duplicates of the real item-update gap tracked below as `PATCH .../pcs|npcs/<id>/items/:id.json`.)

#### Superuser & Game Masters & Staff
- [x] `PATCH /games/<slug>` - GameEdit
- [x] `POST /games/<slug>/treasures` - GameEdit (game-scoped treasure)
- [x] `PATCH /games/<slug>/treasures/<id>` - GameEdit (game-scoped treasure)
- [x] `PATCH /games/<slug>/polls/<id>/close.json` - PollClosePermission

#### Superuser & Game Masters & Character Owner (PC)
- [x] `GET /games/<slug>/pcs/<id>/full.json` - Restricted character details
- [x] `PATCH /games/<slug>/pcs/<id>/full.json` - Restricted character details - CharacterEdit (superuser/DM/owning-player; this is the authoritative entry for this route - a duplicate previously listed under the plain "Superuser & Game Masters" bucket with a `[ ]` has been removed as a stray copy)
- [x] `GET /games/<slug>/pcs/<id>/treasures/all.json` - Restricted character treasures details
- [x] `GET /games/<slug>/pcs/<id>/items/all.json` - Restricted character items detail
- [x] `GET /games/<slug>/pcs/<id>/documents/all.json`

#### Game Masters & Players & Superuser & Staff (Game Scoped)
- [ ] `GET /games/<slug>/players.json` - PlayerPermission currently deliberately excludes staff/superuser (per issue #589/#695). This is an intentional policy reversal: add a staff/superuser bypass, and update `docs/agents/access-control/player.md`'s note accordingly since it currently documents the opposite ("do not fix this back to the default").
- [x] `GET /games/<slug>/polls.json` - PollPermission
- [x] `GET /games/<slug>/polls/<id>.json` - PollPermission
- [x] `POST /games/<slug>/polls.json` - PollPermission
- [x] `GET /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (view)
- [x] `GET /games/<slug>/polls/<id>/votes.json` - PollVotePermission (view)
- [x] `PUT /games/<slug>/pcs/<id>/money.json` - CharacterMoneyEditPermission (verb is `PUT`, not `POST`/`PATCH`)
- [ ] `POST /games/<slug>/pcs/<id>/items.json` - CharacterItemCreatePermission needs a new sibling permission granting any player of the game, in addition to today's dm/staff/owner/superuser (add without touching `CharacterItemCreatePermission` itself, since it's also reused by `items/acquire.json`/`items/remove.json`, out of scope here)
- [ ] `PATCH /games/<slug>/pcs/<id>/items/:id.json` - same fix as above
- [ ] `POST /games/<slug>/npcs/<id>/items.json` - same fix (NPC side)
- [ ] `PATCH /games/<slug>/npcs/<id>/items/:id.json` - same fix (NPC side)
- [x] `POST /games/<slug>/npcs/<id>/photo_upload.json` - CharacterPhotoUploadPermission (already staff + any player of game + dm/owner/superuser)
- [x] `POST /games/<slug>/pcs/<id>/photo_upload.json` - CharacterPhotoUploadPermission (same as above)
- [ ] `POST /games/<slug>/pcs/<id>/items/<item_id>/photo_upload.json` - CharacterItemPhotoUploadPermission needs broadening to include any player of the game + staff (the PC-side counterpart to the NPC narrowing above - the shared class needs splitting into PC/NPC-specific variants)
- [x] `POST /games/<slug>/items/<item_id>/photo_upload.json` - GameItemPhotoUploadPermission (bare/global item photo upload; already staff + any player of game + dm)
- [ ] `POST /games/<slug>/documents.json` - GameDocumentCreatePermission needs a player-of-game grant added (currently dm/staff/superuser only)
- [ ] `POST /games/<slug>/items.json` - GameItemCreatePermission needs the same fix
- [ ] `POST /games/<slug>/game-sessions.json` - GameSessionEditPermission needs staff and player-of-game grants added (currently dm/superuser only, no staff even)
- [ ] `PATCH /games/<slug>/game-sessions/<id>.json` - same fix

(`POST /games/<slug>/npcs.json` previously listed here has been moved out - see "Deferred / Follow-up Issues" below.)

#### Game Masters & Players Only (No Superuser/Staff Bypass)
- [x] `POST /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (create)
- [x] `POST /games/<slug>/polls/<id>/votes.json` - PollVotePermission (vote)

#### Staff & Superuser
- [x] `GET /staff/users.json` (issue previously listed the path as `/users`) - staff-or-superuser via `require_staff`
- [x] `GET /staff/users/<id>.json` - staff-or-superuser
- [x] `PATCH /staff/users/<id>.json` - staff-or-superuser

#### Authenticated Only
- [x] `GET /users/status.json` - IsAuthenticated
- [x] `POST /users/logout.json` - IsAuthenticated
- [x] `GET /account/authorization_requests.json` - IsAuthenticated
- [x] `PATCH /account/authorization_requests/<uuid>/deny.json` - IsAuthenticated (owner-only)
- [x] `PATCH /account/authorization_requests/<uuid>/authorize.json` - IsAuthenticated (owner-only)
- [x] `GET /users/account.json` - IsAuthenticated
- [x] `PATCH /users/account.json` - IsAuthenticated
- [x] `POST /users/language.json` - IsAuthenticated

#### Public/AllowAny (Unauthenticated Access Allowed)
- [x] `GET /games/<slug>`
- [x] `GET /health.json` - AllowAny
- [x] `GET /access-route-config.json` - AllowAny
- [x] `POST /users/login.json` - AllowAny
- [x] `POST /users/register.json` - AllowAny
- [x] `POST /users/recover.json` - AllowAny
- [x] `POST /users/reset-password.json` - AllowAny
- [x] `POST /users/authorization_requests.json` - AllowAny
- [x] `GET /users/authorization_requests/<uuid>.json` - AllowAny
- [x] `GET /games/<slug>/pcs/<id>.json` - Public character detail
- [x] `GET /games/<slug>/pcs/<id>/treasures.json` - Public character treasures detail
- [x] `GET /games/<slug>/pcs/<id>/items.json` - Public character items detail
- [x] `GET /games/<slug>/pcs/<id>/documents.json` - Public character documents detail
- [x] `GET /games/<slug>/npcs/<id>.json` - Public NPC detail
- [x] `GET /games/<slug>/npcs/<id>/treasures.json` - Public character treasures detail
- [x] `GET /games/<slug>/npcs/<id>/items.json` - Public character items detail
- [x] `GET /games/<slug>/npcs/<id>/documents.json` - Public character documents details
- [x] `GET /games.json` - Public game list

### Frontend Features Permissions

#### Game
- [x] Edit button/page (`GameHelper.jsx`) gated on `can_edit` (dm/admin/superuser) - correct, players must not edit the game.

#### PC (reference pattern - already fixed via #865 / PR #867)
- [x] Edit button (`CharacterHelper.jsx`) opens a reduced-field update to any player; full field set stays owner/dm/superuser-only via `CharacterEdit.jsx`.

#### NPC
- [x] Edit button (`CharacterHelper.jsx`) already open to any player, not just owner/dm - matches policy.
- [x] Hidden NPCs stay invisible to players (`fetchPermissionGatedIndex.js` keyed off `can_edit`).
- [x] `private_*` fields withheld server-side for non-DM callers.

("New NPC" create button moved out of scope here - see "Deferred / Follow-up Issues" below; it's covered by #868 alongside the matching backend split.)

#### GameItem (bare/global catalog item)
- [ ] Create button (`GameItemsController.js`, `can_create_item`) is dm/admin/staff-only today - needs to open to any player of the game once `GameItemCreatePermission` is broadened (backend fix above); verify whether `can_create_item` is computed directly from that permission class or duplicated separately, and update accordingly.
- [x] Edit (`GameItemController.js`, `can_edit`) stays dm/admin-only - no player-owner concept for bare items, unaffected by this policy.

#### CharacterItem (PC/NPC-owned)
- [ ] Create/edit (`CharacterItemsHelper.jsx`, `CharacterItemEdit.jsx`) currently includes the PC owner via `CharacterItemCreatePermission`, but needs to also open to any other player of the game once the backend sibling permission (above) ships - verify the frontend flag picks this up automatically or needs its own update.
- [ ] Item-on-NPC photo upload needs to reflect the NPC-side narrowing (drop staff) once the backend permission split ships; item-on-NPC/PC create+update needs to reflect the broadening to any player - same verification as above.

#### Treasure (global + game-scoped)
- [x] New/Edit gated on dm/admin/superuser only, no player path anywhere - correct and intentionally out of scope per policy.

#### Document (game + character-scoped)
- [ ] Bare `GameDocument` create (`GameDocuments.jsx`, `can_create_document`) is dm/admin/staff-only today - needs to open to any player of the game once `GameDocumentCreatePermission` is broadened (backend fix above), same verification note as GameItem create.
- [x] Character-scoped document create/edit already follows the owner-inclusive `CharacterItem`-style pattern - consistent with policy.

#### GameTask
- [x] Entire page (`GameTasks.jsx`/`GameTasksController.js`) gated on dm/admin/superuser only - correct, policy explicitly excludes players from game tasks.

#### GameSession
- [ ] Create/edit (`GameSessions.jsx`/`GameSessionEdit.jsx`, `canEdit`/`session.can_edit`) is dm/admin/superuser-only today - needs to open to staff and any player of the game once `GameSessionEditPermission` is broadened (backend fix above).

#### Poll
- [x] "New Poll" (`GamePollsHelper.jsx`) has no client-side gate; access is game-membership-gated server-side only - consistent with existing design.

#### GamePlayers/Users list
- [x] `GamePlayersHelper.jsx` is read-only, no edit affordances - not implicated by policy. Confirm the page itself isn't route-guarded away from staff, now that `GET .../players.json` is being opened to staff.

#### Staff dashboard
- [x] Gated on staff-or-superuser (`StaffDashboardController.js`) - correct, unrelated to player-empowerment policy.

### Deferred / Follow-up Issues
- **NPC creation** (`POST /games/<slug>/npcs.json` and its "New NPC" frontend button): split off into #868, which adds a player/staff-safe regular create endpoint alongside a new DM/admin-only `POST .../npcs/full.json`, mirroring #865/PR #867's PC pattern.
- **Player self-service PC creation** (`POST /games/<slug>/pcs.json`): the endpoint doesn't exist in the codebase today; needs more scoping before becoming its own issue. Not part of this issue.
- **Game treasures create/update for players**: explicitly future work, called out above.
