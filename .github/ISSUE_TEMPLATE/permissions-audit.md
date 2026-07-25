---
name: Permissions Audit
about: Review and fix incorrect permissions across backend routes and frontend features
title: '[AUDIT] Fix Permissions - Backend Routes & Frontend Features'
labels: 'audit, permissions'
---

## Overview
This issue tracks a comprehensive audit of all backend routes and frontend permissions to identify and fix any incorrect permission assignments.

## Backend Routes Permissions

### Superuser Only
- [ ] `DELETE /games/<slug>` - GameEdit
- [ ] `DELETE /treasures/<id>` - Admin/Django-admin only

### Superuser & Staff
- [ ] `POST /users/test-email.json` - Staff-or-superuser
- [ ] `GET /treasures` (global treasure list) - Staff-or-superuser
- [ ] `POST /treasures` (global treasure create) - Staff-or-superuser
- [ ] `PATCH /treasures/<id>` (global treasure update) - Staff-or-superuser

### Superuser & Game Masters & Staff
- [ ] `GET /games/<slug>` - GameEdit
- [ ] `PATCH /games/<slug>` - GameEdit
- [ ] `POST /games/<slug>/treasures` - GameEdit (game-scoped treasure)
- [ ] `PATCH /games/<slug>/treasures/<id>` - GameEdit (game-scoped treasure)
- [ ] `POST /games/<slug>/pcs.json` - GameEdit
- [ ] `POST /games/<slug>/npcs.json` - GameEdit
- [ ] `PATCH /games/<slug>/pcs/<id>/full.json` - CharacterEdit
- [ ] `PATCH /games/<slug>/npcs/<id>/full.json` - CharacterEdit
- [ ] `POST /games/<slug>/documents.json` - GameDocumentCreatePermission (dm, admin, or staff)
- [ ] `POST /games/<slug>/items.json` - GameItemCreatePermission (dm, admin, or staff)
- [ ] `POST /games/<slug>/game-sessions.json` - GameSessionEditPermission
- [ ] `PATCH /games/<slug>/game-sessions/<id>.json` - GameSessionEditPermission
- [ ] `POST /games/<slug>/tasks.json` - TaskEditPermission
- [ ] `PATCH /games/<slug>/tasks/<id>.json` - TaskEditPermission
- [ ] `PATCH /games/<slug>/polls/<id>/close.json` - PollClosePermission (DM or superuser only)

### Superuser & Game Masters & Staff & Character Owner (PC only)
- [ ] `POST /games/<slug>/pcs/<id>/money.json` - CharacterMoneyEditPermission
- [ ] `PATCH /games/<slug>/pcs/<id>/money.json` - CharacterMoneyEditPermission

### Superuser & Game Masters & Staff & Character Owner (PC) / Superuser & Game Masters & Staff (NPC)
- [ ] `PATCH /games/<slug>/pcs/<id>/items.json` - CharacterItemCreatePermission
- [ ] `PATCH /games/<slug>/npcs/<id>/items.json` - CharacterItemCreatePermission
- [ ] `POST /games/<slug>/pcs/<id>/photo_upload.json` - CharacterPhotoUploadPermission
- [ ] `POST /games/<slug>/npcs/<id>/photo_upload.json` - CharacterPhotoUploadPermission
- [ ] `POST /games/<slug>/pcs/<id>/items/<item_id>/photo_upload.json` - CharacterItemPhotoUploadPermission
- [ ] `POST /games/<slug>/npcs/<id>/items/<item_id>/photo_upload.json` - CharacterItemPhotoUploadPermission

### Game Masters & Players & Superuser & Staff
- [ ] `GET /games/<slug>/players.json` - PlayerPermission (players/DM only, BUT Staff can list any game's players - see issue #589)
- [ ] `GET /games/<slug>/polls.json` - PollPermission
- [ ] `GET /games/<slug>/polls/<id>.json` - PollPermission
- [ ] `POST /games/<slug>/polls.json` - PollPermission
- [ ] `GET /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (view)
- [ ] `GET /games/<slug>/polls/<id>/votes.json` - PollVotePermission (view)

### Game Masters & Players Only (No Superuser/Staff Bypass)
- [ ] `POST /games/<slug>/game-sessions/<id>/messages.json` - SessionMessagePermission (create)
- [ ] `POST /games/<slug>/polls/<id>/votes.json` - PollVotePermission (vote)

### Game Masters & Players & Superuser & Staff (Game Scoped)
- [ ] `GET /games/<slug>.json` - PublicGameDetail or similar (any player/dm/admin/staff)
- [ ] `GET /games/<slug>/pcs.json` - Public (any player/dm/admin/staff)
- [ ] `GET /games/<slug>/npcs.json` - Public (any player/dm/admin/staff)

### Staff & Superuser (All Users)
- [ ] `GET /users` - Staff-or-superuser
- [ ] `GET /users/<id>` - Staff-or-superuser
- [ ] `PATCH /users/<id>` - Staff-or-superuser

### Authenticated Only
- [ ] `GET /users/status.json` - IsAuthenticated
- [ ] `POST /users/logout.json` - IsAuthenticated
- [ ] `GET /account/authorization_requests.json` - IsAuthenticated
- [ ] `PATCH /account/authorization_requests/<uuid>/deny.json` - IsAuthenticated (owner-only)
- [ ] `PATCH /account/authorization_requests/<uuid>/authorize.json` - IsAuthenticated (owner-only)
- [ ] `GET /users/account.json` - IsAuthenticated
- [ ] `PATCH /users/account.json` - IsAuthenticated
- [ ] `POST /users/language.json` - IsAuthenticated

### Public/AllowAny (Unauthenticated Access Allowed)
- [ ] `GET /health.json` - AllowAny
- [ ] `GET /access-route-config.json` - AllowAny
- [ ] `POST /users/login.json` - AllowAny
- [ ] `POST /users/register.json` - AllowAny
- [ ] `POST /users/recover.json` - AllowAny
- [ ] `POST /users/reset-password.json` - AllowAny
- [ ] `POST /users/authorization_requests.json` - AllowAny
- [ ] `GET /users/authorization_requests/<uuid>.json` - AllowAny
- [ ] `GET /games/<slug>/pcs/<id>.json` - Public character detail
- [ ] `GET /games/<slug>/npcs/<id>.json` - Public NPC detail
- [ ] `GET /games.json` - Public game list

## Frontend Permissions (Simulated Roles)

### Admin Role
- [ ] Full game access
- [ ] All character management
- [ ] User management access
- [ ] Global treasure management
- [ ] Staff/superuser features

### Game Master (DM) Role
- [ ] Game edit
- [ ] All character management in game
- [ ] Game sessions/tasks management
- [ ] Polls, documents, items creation
- [ ] Player roster viewing
- [ ] Money/treasure operations

### Player Role
- [ ] Character detail (own and party members)
- [ ] Game sessions viewing
- [ ] Poll participation (vote)
- [ ] Session messages (limited)
- [ ] Money/item management (limited to own PC)

### Unauthenticated / Public Role
- [ ] Game list viewing
- [ ] Public game details
- [ ] Public character profiles (PC/NPC)

## Known Issues & Special Cases

### CharacterPhotoUploadPermission (Issue #619, #668, #713)
- Staff may upload photos for **any** PC/NPC, even without game involvement
- Any player of the game may upload for their own/party characters
- "Set as profile photo" uses the same rule (Issue #852)

### CharacterMoneyEditPermission (Issue #615, #625)
- PC money: superuser, DM, owner, **or any player** of the game, or staff
- NPC money: superuser, DM, staff only (no "any player" grant)

### PlayerPermission (Issue #695)
- **Deliberately no superuser/staff bypass** — staff/superuser cannot browse game rosters
- Exception: Staff CAN list players (Issue #589) but cannot edit

### PollPermission vs SessionMessagePermission
- **Polls**: view and create use same rule (DM/player/admin/staff)
- **Messages**: view allows admin/staff, but **create is player/DM only** (no admin/staff bypass)

### PollVotePermission
- View votes: DM/player/admin/staff
- Cast vote: **DM/player only** (no admin/staff bypass)

## Notes
Add any observations, issues found, or patterns to fix here.

## Completed
Once all permissions are reviewed and corrected, check this box:
- [ ] All permissions reviewed and fixed
