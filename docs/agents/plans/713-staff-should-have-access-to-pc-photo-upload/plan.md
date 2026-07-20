# Plan: Staff should have access to NPC photo upload

Issue: [713-staff-should-have-access-to-pc-photo-upload.md](../../issues/713-staff-should-have-access-to-pc-photo-upload.md)

## Overview

PCs already grant staff (`user.is_staff`) photo-upload access via `CharacterPhotoUploadPermission`
(issues #619, #668), but NPCs still use `NpcPlayerEditPermission`, which has no staff bypass. Since
`CharacterPhotoUploadPermission`'s check is not actually PC-specific (staff, or player of the game,
or the standard edit chain), the fix is to stop branching on `npc`/PC at the two photo-upload
dispatch points and always use `CharacterPhotoUploadPermission` — rather than adding a staff bypass
to `NpcPlayerEditPermission` itself, which is also reused verbatim by the unrelated NPC
"toggle slain" endpoint (`backend/games/views/game/npcs/_npc_player_update.py`) and must keep its
narrower behavior there. The frontend then just needs to stop hiding the Upload button from staff
on NPC pages.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

None. `character.is_staff` is already exposed on both PC and NPC character objects (via the shared
`BaseAccessSerializer._get_is_staff`) — no new/changed field. The backend and frontend changes are
independent line-level fixes; nothing produced by one is consumed by the other. Both changes must
land together for the feature to actually be usable (backend permits the request, frontend exposes
the button), but there is no interface to synchronize.
