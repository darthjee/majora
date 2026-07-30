# Mapping: old permissions.py classes → new resources/actions

Main plan: [plan.md](plan.md)

Source: `backend/games/permissions.py` (676 lines, 26 classes) as of this plan's writing.
Every row must be double-checked against the actual class body during migration — this table
condenses `is_allowed`/`is_allowed_for_roles`/`check*` into a role list, but several classes
apply a role conditionally (e.g. "player leniency PC-only") captured in the Notes column;
don't lose those conditions when writing the YAML.

## Role resolution (for the `Roles` class, Step 2)

| Role | Resolved from |
|------|---------------|
| `admin` | `user.is_superuser` |
| `staff` | `user.is_staff` |
| `logged_user` | `user.is_authenticated` |
| `dm` | `game.has_player(user, is_dm=True)` (`Player.is_dm` field) |
| `player` | `game.has_player(user)` (any `Player` row, dm or not) |
| `owner` | `pc.can_be_edited_by_roles(...)`'s owner branch — only meaningful when `pc.is_pc` |

`_is_admin_or_player(user, game)` (today: `AdminOrStaffCache.is_admin_or_staff(user) or
game.has_player(user)`) is just `is_admin() or is_staff() or is_player()` on the new `Roles`
object — no separate helper needed once `Roles` exists.

## Class → resource/action mapping

| Old class | New resource | Action | Tier | Extra allowed roles (beyond dm/admin shortcut) | Notes |
|---|---|---|---|---|---|
| `GameEditPermission` | `game` | `edit` | restricted mutation | — | plain `can_be_edited_by` |
| `GameSessionEditPermission` | `game_session` | `edit` | regular mutation | `staff`, `player` | accepts `Game` or `GameSession` as `obj` — resolve to game either way |
| `TaskEditPermission` | `game_task` | `edit` | restricted mutation | — | plain `can_be_edited_by` |
| `GameItemCreatePermission` | `game_item` | `create` | regular mutation | `staff`, `player` | |
| `GameItemPhotoUploadPermission` | `game_item` | `photo_upload` | regular mutation | `staff`, `player` | |
| `GameDocumentCreatePermission` | `game_document` | `create` | regular mutation | `staff`, `player` | |
| `GameDocumentPhotoUploadPermission` | `game_document` | `photo_upload` | regular mutation | `staff`, `player` | |
| `GameDocumentFileUploadPermission` | `game_document` | `file_upload` | regular mutation | `staff`, `player` | |
| `GameDocumentFilePhotoUploadPermission` | `game_document` | `file_photo_upload` | regular mutation | `staff`, `player` | |
| `TreasureEditPermission` | `treasure` | `edit` | restricted mutation | — | game-level treasure, distinct from character treasure exchange below |
| `CharacterEditPermission` | `game_pc` / `game_npc` | `edit` | restricted mutation | `owner` (PC only) | `owner` never applies to `game_npc` |
| `NpcPlayerEditPermission` | `game_npc` | `player_edit` | regular mutation | `player` | narrow "toggle slain"-style edit |
| `CharacterPhotoUploadPermission` | `game_pc` / `game_npc` | `photo_upload` (also backs "set profile photo") | regular mutation | `staff`, `player` | `owner` still applies via base edit chain on PC |
| `CharacterPhotoDeletePermission` | `game_pc` / `game_npc` | `photo_delete` | restricted mutation | `staff` | no owner/player leniency at all |
| `CharacterMoneyEditPermission` | `game_pc` | `money_edit` | regular mutation | `staff` (global), `player` (PC only) | NPC side: resource `game_npc`, tier restricted, `staff` only — no player leniency for NPCs |
| `CharacterRegularEditPermission` | `game_pc` | `regular_edit` | regular mutation | `staff`, `player` | PC-only endpoint, no NPC counterpart at all |
| `CharacterTreasureExchangePermission` | `game_pc` / `game_npc` | `treasure_exchange` | restricted mutation | `staff` | deliberately no player leniency (unlike money edit) |
| `CharacterItemCreatePermission` | `game_pc_item` / `game_npc_item` | `create` | restricted mutation | `staff` | also reused unchanged by item acquire/remove endpoints (#773) — same rule, 3 call sites |
| `CharacterItemPlayerCreatePermission` | `game_pc_item` / `game_npc_item` | `create_update` (broadened) | regular mutation | `staff`, `player` | separate action from the row above — different call sites |
| `CharacterItemPhotoUploadPermission` | `game_pc_item` | `photo_upload` | regular mutation | `staff`, `player` | NPC side: resource `game_npc_item`, tier restricted, no `staff` bypass (narrowed per #864) |
| `SessionMessagePermission` (view) | `session_message` | `show` | regular show | `staff`, `player` | |
| `SessionMessagePermission` (create) | `session_message` | `create` | regular mutation | `player` only | **`no_shortcut: true`** — see plan.md Notes, admin/staff do NOT bypass here unless also a player/dm |
| `PollPermission` | `poll` | `view_create` | regular show + mutation (identical rule for both) | `staff`, `player` | view and create share the exact same check today |
| `PollClosePermission` | `poll` | `close` | restricted mutation | — | plain `can_be_edited_by` (dm/admin only) |
| `PollVotePermission` (view) | `poll_vote` | `show` | regular show | `staff`, `player` | |
| `PollVotePermission` (vote) | `poll_vote` | `vote` | regular mutation | `player` only | **`no_shortcut: true`** — same deviation as `session_message.create` |
| `PlayerPermission` | `player` (resource, not the role) | `show` | regular show | `staff`, `player` | reversed in #864 to include staff/superuser (previously excluded, #695/#589) |

## UI permission mapping (`*PermissionsSerializer` → `UIPermission`)

`CharacterPermissionsSerializer` (`backend/games/serializers/characters/character_permissions.py`)
exposes these `can_*` booleans, each backed by one of the endpoint classes above via
`is_allowed`/`is_allowed_for_roles` — confirm the corresponding `game_pc`/`game_npc`
`ui.yml` lists the *same* roles as that resource/action's `endpoints.yml` entry, since it's
the same underlying rule today:

- `can_edit` → `game_pc`/`game_npc`.`edit`
- `can_create_item` → `game_pc_item`/`game_npc_item`.`create_update`
- `can_upload_item_photo` → `game_pc_item`/`game_npc_item`.`photo_upload`
- `can_edit_money` → `game_pc`/`game_npc`.`money_edit`
- `can_exchange_treasure` → `game_pc`/`game_npc`.`treasure_exchange`
- `can_set_profile_photo` → `game_pc`/`game_npc`.`photo_upload`
- `can_delete_photo` → `game_pc`/`game_npc`.`photo_delete`

`GamePermissionsSerializer` and `TreasurePermissionsSerializer`
(`backend/games/serializers/games/game_permissions.py`,
`backend/games/serializers/treasures/treasure_permissions.py`) need the same treatment —
read both during Step 7 and add their `can_*` fields to this table before migrating them
(not reproduced here since they weren't read in full while writing this plan).

## Call-site inventory

Full list of files importing `permissions.py` today (`grep -rl "permissions import"
backend/games --include=*.py | grep -v /tests/`) — 55 view files plus the 3
`*_permissions.py` serializers — is in the issue's exploration notes; re-run that grep at
the start of Step 7 to get the authoritative, current list rather than trusting a stale copy
here.
