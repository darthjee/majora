# Product Definitions

This document is the authoritative reference for product-level concepts in Majora.
Specialist agents and the architect consult it when reasoning about domain rules,
ownership, and feature design. When product concepts are refined or new entities are
introduced, update this document in the same PR.

---

## Core Entities

### Game (Campaign)

A **Game** represents a single tabletop RPG campaign. It has a name, a unique URL slug,
an optional cover photo, a description, and a gallery of zero or more additional photos
(`GamePhoto` records). All characters, players, and game masters belong to exactly one
game.

### Player

A **Player** is a human participant in a game. Each Player record has a display name and
may be linked to a Django `User` account (`player.user`). A `Player` without a linked
`User` is a named participant with no login identity.

A Player belongs to exactly one game (`Player.game` FK). Within a game, a Player owns
zero or more characters. A Player's `is_dm` flag marks them as that game's DM/GameMaster
— see [GameMaster Role](#gamemaster-role) below.

### User (Account)

A **User** is a Django authentication account (`django.contrib.auth.models.User`). A
`User` may be linked to at most one `Player` record per game (through the `Player.user`
FK).

A `User` is **not** scoped to any single game — unlike `Character` and `Player`, a `User`
is a global identity. It has a `username` (the real, unique login
credential; also editable as first/last name via `first_name`/`last_name`) plus a
`UserProfile.display_name` (unique, public-facing name shown to other users wherever a
user's name is displayed to a general audience, e.g. session message authors and poll
voters). Only the user themselves (`/#/my_account`) and staff (`/#/staff/users`) can see
the real `username`; `display_name` never exposes the login credential.

### Character

A **Character** is an in-game persona that belongs to a single game. Characters are
either **Player Characters (PCs)** or **Non-Player Characters (NPCs)**:

- **PC** (`npc=False`): a character owned by a specific `Player`.
- **NPC** (`npc=True`): a character with no player owner (controlled by the game master
  or narrative).

A character has a name, optional avatar, class, level, a public description (visible to
all), and a private description (visible only to editors).

### GameMaster (DM / Dungeon Master)

A **GameMaster** (DM) is a `Player` of a game with `is_dm=True`, granting that user full
editorial authority over all characters in that game. `Player.is_dm` is the single source
of truth for DM status — there is no separate GameMaster model or table. A user may be a
GameMaster in multiple games simultaneously (one `Player` row per game), and a game may
have multiple GameMasters.

### Treasure

A **Treasure** is a named, valued item (`name`, `value`, optional photo) that is either
**global** or **exclusive to one game** (issue #296). Exclusive ownership is a direct,
nullable `game` foreign key on `Treasure` — parallel to how a `Character` belongs to
exactly one game — and is distinct from the pre-existing, non-exclusive `Game.treasures`
many-to-many relationship, which merely lists a treasure under any number of games without
implying ownership. A treasure can simultaneously be M2M-linked to several games *and*
exclusively owned (via the `game` FK) by at most one of them, or none. Only that owning
game's GameMaster (or a superuser) may create or edit a game-exclusive treasure through the
game-scoped endpoints; the pre-existing global treasure endpoints remain superuser-only
regardless of a treasure's `game`. See [access-control/treasure.md](access-control/treasure.md) for the full
endpoint and permission breakdown.

### GameItem / CharacterItem

A **GameItem** is a special magic item belonging to exactly one game (`name`, `description`,
optional photo, `hidden`) — simpler than `Treasure`: there is no shared cross-game registry, so
`GameItem` itself is the top of the item hierarchy rather than a per-game link to a separately
owned catalog row. A **CharacterItem** links a `GameItem` to a PC or NPC, with its own optional
`name`/`description`/`photo` overrides that fall back to the linked `GameItem`'s values when
`null`, and its own independent `hidden` flag. Both are read-only in the current issue (no
create, update, or photo upload flow) — see
[access-control/game-item.md](access-control/game-item.md) and
[access-control/character-item.md](access-control/character-item.md) for the full endpoint and
permission breakdown.

### Poll

A **Poll** is a game-scoped question (`title`, `description`, a `type` of single- or
multiple-choice) with a fixed set of `PollOption`s, belonging to exactly one game via a direct
`game` foreign key — the same "belongs to exactly one game" shape as `Character` and a
game-exclusive `Treasure`. Unlike `Treasure`, a poll has no GM-only administration model: it is
game-scoped collaborative content, closer to a `GameSession`/session message, so its full
audience — the game's GameMaster(s), players, and admins (superuser/staff) — may both view
**and** create polls, with no stricter create-only rule. A poll has no individual "owner"; access
is entirely game-scoped, not per-record. Voting (`PollVote`, linking a `Player` to the option
they chose) exists at the model level but has no endpoint yet — out of scope until a follow-up
issue. See [access-control/poll.md](access-control/poll.md) for the full endpoint and permission
breakdown.

---

## Ownership Chain

The owner of a character is the Django `User` reachable via:

```
character.player.user
```

Both FK links are **nullable**:

- If `character.player` is `None` — the character has no player, and therefore no owner.
- If `character.player.user` is `None` — the player exists but is not linked to a login
  account; the character has no owner.
- If both links are set — the owner is `character.player.user`.

This chain is the single source of truth for character ownership. Any code that checks
"is this user the owner?" must traverse this chain.

---

## GameMaster Role

A user is a **GameMaster** (DM) for a game when a `Player` record exists with
`player.game == character.game`, `player.user == user`, and `player.is_dm is True`.

GameMasters can edit any character in their game — PCs and NPCs alike.

The GameMaster role is **game-scoped**: being a DM in one game grants no authority in
any other game.

---

## Staff Role

A **Staff** account is a Django `User` with `is_staff is True` (Django's built-in field,
introduced for product use by issue #286). Staff, like Superuser, is a **global** role —
not scoped to any game.

Staff has full parity with Superuser on any endpoint that is **not scoped under a
specific game** (issue #526 broadens this from the original User-management-only carve-out
of issue #286). Today that means:

- User management: Staff accounts (`is_staff` or `is_superuser`) may list, view, and edit
  the `name` (`username`) and `email` of any `User` account, and may generate a
  password-recovery link for any user without needing access to that user's email inbox.
- Global [Treasure](access-control/treasure.md) management: Staff may create and update a
  *global* treasure (one with no owning `game`) and upload its photo, exactly like a
  Superuser. This precedent — a Staff-or-superuser-gated endpoint outside User-management
  — already existed for `POST /users/test-email.json` (`require_staff`,
  [endpoints.md](access-control/endpoints.md)); the Treasure surface generalizes the same
  policy rather than inventing a new one.

Staff gains **no** authority over any game-scoped resource — Character, Player,
GameSession, Task, or the `/games/:game_slug/treasures*` routes remain governed solely by
GameMaster/Superuser, never Staff. Staff also never reaches into
Django-admin-only actions (e.g. Treasure or Game deletion — see
[access-control.md](access-control.md)'s existing admin carve-out), regardless of how far
the Staff role's endpoint-level parity with Superuser grows.

The one explicit, named exception to this game-scoped carve-out (issue #619): Staff may
upload a photo for a **PC** (`POST /games/:game_slug/pcs/:id/photo_upload.json`), for any
game, without being a player or GameMaster of that game. This does not extend to NPC photo
upload (`NpcPlayerEditPermission` is unchanged and still has no Staff bypass) nor to any
other game-scoped resource.

---

## Editing Rules

A user may edit a character when **any** of the following is true:

1. The user is a **superuser** (`user.is_superuser is True`) — full access everywhere.
2. The user is the character's **owner** per the Ownership Chain above.
3. The user is a **GameMaster** for the same game — i.e. a `Player` record links `user`
   to `character.game` with `is_dm=True`.

Any other authenticated or unauthenticated user may not edit the character.

This logic is implemented in `Character.can_be_edited_by(user)` and
`Character.is_editor(user)` in `backend/games/models/character.py`.

Separately, and narrower in scope (issue #416, widened by issue #445): a user who is a
**player of the game** — the same `is_player` computation exposed on `.../access.json`
endpoints, i.e. a `Player` record linked to `character.game` via `Player.games` whose `user`
matches the requester — may update an NPC's `public_description`, `links`, `allegiance`
(its player-facing "allegiance", writing `public_allegiance`), and `slain` (its player-facing
"slain" state, writing `public_slain`) through `PATCH /games/:game_slug/npcs/:id.json`, even
without satisfying any of the three rules above. This is not a general editing right: it
grants no access to `name`, `role`, `money`, `private_description`, or the real `slain`/
`allegiance` fields, and does not apply to PCs. It exists alongside (not instead of) the rules
above, so a GameMaster/superuser can still use the same endpoint.

Issue #429 extends this same "player of the game" authorization to a second capability: NPC
photo upload. A player of the game may initiate an NPC photo upload
(`POST /games/:game_slug/npcs/:id/photo_upload.json`) and finalize it
(`PATCH /uploads/:id.json`), even without being that NPC's owner (moot, since NPCs have no
owner) or a GameMaster/superuser. Both checkpoints reuse the same
`NpcPlayerEditPermission` introduced by #416, rather than a new permission — this remains
NPC-only.

Issue #619 extends a parallel, PC-specific leniency to **PC photo upload**
(`POST /games/:game_slug/pcs/:id/photo_upload.json`). In addition to the Editing rights above
(superuser, the PC's owning player, or a GameMaster of the same game), this single endpoint
also allows: any other player of the game (via `Player.games`, regardless of whether they
own this specific PC), and any Staff account (`user.is_staff`, global — not scoped to games
the Staff user is otherwise involved in). This is implemented by a new, narrowly-scoped
`CharacterPhotoUploadPermission`, distinct from both `NpcPlayerEditPermission` (which has no
Staff bypass and stays NPC-only) and `CharacterEditPermission` (which still governs full PC
editing — name, description, and other fields — unchanged and unaffected by this issue).

Issue #615 adds a narrower, dedicated **money-only edit** capability
(`PUT /games/:game_slug/pcs/:id/money.json`, `PUT /games/:game_slug/npcs/:id/money.json`), so a
quick "Edit" link can sit directly on the character show page instead of requiring the full
character edit page. Access is: superuser, any GameMaster of the game, any Staff account
(`user.is_staff`, global), or — implemented by a new `CharacterMoneyEditPermission`. For a **PC**,
issue #625 broadened this further: any player of that PC's game may edit its money (not just the
PC's own owning player, via `character.game.players`), mirroring issue #619's
`CharacterPhotoUploadPermission` leniency. This leniency is **PC-only** — an NPC has no owning
player, so NPC money edits stay admin/dm/staff-only, and a regular player of the game who isn't
also that NPC's GameMaster gets no access to it. `CharacterDetailSerializer` also gains a
`can_edit_money` boolean field (computed with the same rule), letting the frontend hide the edit
link entirely for a caller who isn't authorized, independently of the existing `can_edit` field
(which stays `false` for a Staff-only or any-player-only caller, since neither is a full editor).

---

## Summary Table

| Concept | Key rule |
|---------|---------|
| Character owner | `character.player.user` — null if either FK is null |
| GameMaster scope | Per-game; no cross-game authority |
| Editing rights | Superuser OR owner OR GameMaster of same game |
| PC vs NPC | `npc=False` → PC (has player); `npc=True` → NPC (no player) |
| Player account link | `Player.user` nullable — player without a login has no owner |
| Staff role | `user.is_staff` — global; full parity with Superuser on any non-game-scoped endpoint (User management, global Treasure management); no authority over game-scoped resources or Django-admin-only actions |
| NPC narrow player PATCH | Any player of the game (via `Player.games`), in addition to the Editing rights above — NPC-only; `public_description`, `links`, `allegiance` (→`public_allegiance`), `slain` (→`public_slain`) fields only |
| NPC photo upload (init/finalize) | Any player of the game (via `Player.games`), in addition to the Editing rights above — NPC-only, same `NpcPlayerEditPermission` as the narrow player PATCH row above (issue #429) |
| PC photo upload (init) | Any player of the game (via `Player.games`), OR any Staff account (`user.is_staff`, global), in addition to the Editing rights above — PC-only, new `CharacterPhotoUploadPermission` (issue #619); full PC editing still uses `CharacterEditPermission` unchanged |
| Character money edit | Editing rights above (superuser, owner, GameMaster), OR any Staff account (`user.is_staff`, global), OR — PC-only — any player of the game (issue #625); NPCs get no player leniency, staying admin/dm/staff-only; `CharacterMoneyEditPermission` (issue #615), gates `PUT .../pcs/<id>/money.json` and `PUT .../npcs/<id>/money.json`, plus the `can_edit_money` read field |
