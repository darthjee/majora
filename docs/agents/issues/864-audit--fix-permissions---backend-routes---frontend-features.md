# Issue: [AUDIT] Fix Permissions - Backend Routes & Frontend Features

## Description
Comprehensive audit of backend route permissions and frontend feature-level gating across the app, verified against a policy shift that gives players more power to create and update content collaboratively while still protecting private/hidden information. This issue tracks the audit itself; items that require new functionality (not just re-wiring an existing permission check) are expected to be split into their own dedicated issues as they're picked up — as already happened for PC updates (#865, delivered via PR #867, listed below as a reference pattern).

Two problems were found and corrected in the original draft during review (see the checklists below): a duplicated/contradictory line for NPC full-edit, and two adjacent lines whose descriptions had been scrambled together while drafting.

Player self-service PC creation (`POST /games/<slug>/pcs.json`) was also identified as a gap — the endpoint doesn't exist in the codebase today — but is explicitly **deferred**: it needs more scoping before it becomes its own issue, and is out of scope here.

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

`[x]` marks an item already confirmed correct; `[ ]` marks an item confirmed incorrect and needing a fix.

## Solution

### Backend Routes Permissions

#### Superuser Only
- [ ] `DELETE /games/<slug>` - GameEdit (this endpoint needs to be removed)
- [ ] `DELETE /treasures/<id>` - Admin/Django-admin only (this endpoint needs to be removed)

#### Superuser & Staff
- [x] `POST /users/test-email.json` - Staff-or-superuser
- [x] `GET /treasures` (global treasure list) - Staff-or-superuser
- [x] `POST /treasures` (global treasure create) - Staff-or-superuser
- [x] `PATCH /treasures/<id>` (global treasure update) - Staff-or-superuser

#### Superuser & Game Masters
- [ ] `POST /games/<slug>/tasks.json` - TaskEditPermission
- [ ] `PATCH /games/<slug>/tasks/<id>.json` - TaskEditPermission
- [ ] `PATCH /games/<slug>/pcs/<id>/full.json` - CharacterEdit
- [x] `PATCH /games/<slug>/npcs/<id>/full.json` - CharacterEdit (superuser/DM-only for NPCs, already matches this bucket)
- [ ] `GET /games/<slug>/items/all.json`
- [ ] `PATCH /games/<slug>/items/:id/full.json`
- [ ] `GET /games/<slug>/treasures/all.json`
- [ ] `PATCH /games/<slug>/treasures/:id/full.json`
- [ ] `GET /games/<slug>/documents/all.json`
- [ ] `PATCH /games/<slug>/documents/:id/full.json`
- [ ] `GET /games/<slug>/npcs/<id>/documents/all.json` - Restricted character documents details
- [x] `GET /games/<slug>/npcs/<id>/full.json` - Restricted character detail
- [x] `GET /games/<slug>/npcs/<id>/treasures/all.json` - Restricted character treasures detail
- [x] `GET /games/<slug>/npcs/<id>/items/all.json`
- [ ] `PATCH /games/<slug>/npcs/<id>/items/:id/full.json`
- [ ] `POST /games/<slug>/npcs/<id>/items/<item_id>/photo_upload.json` - CharacterItemPhotoUploadPermission

#### Superuser & Game Masters & Staff
- [x] `PATCH /games/<slug>` - GameEdit
- [x] `POST /games/<slug>/treasures` - GameEdit (game-scoped treasure)
- [x] `PATCH /games/<slug>/treasures/<id>` - GameEdit (game-scoped treasure)
- [x] `PATCH /games/<slug>/polls/<id>/close.json` - PollClosePermission

#### Superuser & Game Masters & Character Owner (PC)
- [x] `GET /games/<slug>/pcs/<id>/full.json` - Restricted character details
- [x] `PATCH /games/<slug>/pcs/<id>/full.json` - Restricted character details
- [x] `GET /games/<slug>/pcs/<id>/treasures/all.json` - Restricted character treasures details
- [x] `GET /games/<slug>/pcs/<id>/items/all.json` - Restricted character items detail
- [ ] `PATCH /games/<slug>/pcs/<id>/items/:id/full.json`
- [x] `GET /games/<slug>/pcs/<id>/documents/all.json`

#### Game Masters & Players & Superuser & Staff (Game Scoped)
- [ ] `GET /games/<slug>/players.json` - PlayerPermission (players/DM only, BUT Staff can list any game's players - see issue #589)
- [ ] `GET /games/<slug>/polls.json` - PollPermission
- [ ] `GET /games/<slug>/polls/<id>.json` - PollPermission
- [ ] `POST /games/<slug>/polls.json` - PollPermission
- [ ] `GET /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (view)
- [ ] `GET /games/<slug>/polls/<id>/votes.json` - PollVotePermission (view)
- [ ] `POST /games/<slug>/pcs/<id>/money.json` - CharacterMoneyEditPermission
- [ ] `PATCH /games/<slug>/pcs/<id>/money.json` - CharacterMoneyEditPermission
- [ ] `POST /games/<slug>/pcs/<id>/items.json`
- [ ] `PATCH /games/<slug>/pcs/<id>/items/:id.json`
- [ ] `POST /games/<slug>/npcs/<id>/items.json`
- [ ] `PATCH /games/<slug>/npcs/<id>/items/:id.json`
- [ ] `POST /games/<slug>/npcs/<id>/photo_upload.json`
- [ ] `POST /games/<slug>/pcs/<id>/photo_upload.json`
- [ ] `POST /games/<slug>/pcs/<id>/items/<item_id>/photo_upload.json`
- [ ] `POST /games/<slug>/items/<item_id>/photo_upload.json`
- [ ] `POST /games/<slug>/documents.json` - GameDocumentCreatePermission
- [ ] `POST /games/<slug>/items.json` - GameItemCreatePermission
- [ ] `POST /games/<slug>/game-sessions.json` - GameSessionEditPermission
- [ ] `PATCH /games/<slug>/game-sessions/<id>.json` - GameSessionEditPermission
- [ ] `POST /games/<slug>/npcs.json` - GameEdit

#### Game Masters & Players Only (No Superuser/Staff Bypass)
- [x] `POST /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (create)
- [x] `POST /games/<slug>/polls/<id>/votes.json` - PollVotePermission (vote)

#### Staff & Superuser
- [ ] `GET /users` - Staff-or-superuser
- [ ] `GET /users/<id>` - Staff-or-superuser
- [ ] `PATCH /users/<id>` - Staff-or-superuser

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
- [ ] "New NPC" create button (`GameCharactersHelper.jsx` / `GameNpcs.jsx`) is gated on game-level `can_edit` (dm/admin/superuser only) instead of a dedicated player-inclusive flag - conflicts with the policy that players should be able to create NPCs. Needs a server-authoritative `can_create_character`-style flag, mirroring `can_create_item`/`can_create_document`.
- [x] Hidden NPCs stay invisible to players (`fetchPermissionGatedIndex.js` keyed off `can_edit`).
- [x] `private_*` fields withheld server-side for non-DM callers.

#### GameItem (bare/global catalog item)
- [x] Create (`GameItemsController.js`) and edit (`GameItemController.js`) both dm/admin/staff-only - no player-owner concept, consistent with current design; not part of the player-empowerment policy.

#### CharacterItem (PC/NPC-owned)
- [x] Create/edit (`CharacterItemsHelper.jsx`, `CharacterItemEdit.jsx`) already includes the PC owner via `CharacterItemCreatePermission` - matches policy.
- [ ] Item-on-NPC edit remains dm/staff-only (no owner concept for NPCs), narrower than the NPC-itself edit button that's already open to any player - flagged for a follow-up decision, not resolved here.

#### Treasure (global + game-scoped)
- [x] New/Edit gated on dm/admin/superuser only, no player path anywhere - correct and intentionally out of scope per policy.

#### Document (game + character-scoped)
- [x] Bare `GameDocument` create is dm/admin/staff-only by design; character-scoped document create/edit follows the same owner-inclusive pattern as `CharacterItem` - consistent with policy.

#### GameTask
- [x] Entire page (`GameTasks.jsx`/`GameTasksController.js`) gated on dm/admin/superuser only - correct, policy explicitly excludes players from game tasks.

#### GameSession
- [x] Create/edit (`GameSessions.jsx`/`GameSessionEdit.jsx`) dm/admin/superuser-only - unaffected by policy, no conflict.

#### Poll
- [x] "New Poll" (`GamePollsHelper.jsx`) has no client-side gate; access is game-membership-gated server-side only - consistent with existing design.

#### GamePlayers/Users list
- [x] `GamePlayersHelper.jsx` is read-only, no edit affordances - not implicated by policy.

#### Staff dashboard
- [x] Gated on staff-or-superuser (`StaffDashboardController.js`) - correct, unrelated to player-empowerment policy.

### Deferred / Out of Scope
- Player self-service PC creation (`POST /games/<slug>/pcs.json`) - endpoint doesn't exist in the codebase today; needs more scoping before becoming its own issue. Not part of this issue.
- Game treasures create/update for players - explicitly future work, called out above.
- Item-on-NPC edit permission being narrower than NPC-itself edit - flagged as an open question for a future decision, not resolved here.
