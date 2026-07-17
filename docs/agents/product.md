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

A **Player** is a human participant in one or more games. Each Player record has a
display name and may be linked to a Django `User` account (`player.user`). A `Player`
without a linked `User` is a named participant with no login identity.

A Player may belong to multiple games (many-to-many relationship). Within a game, a
Player owns zero or more characters.

### User (Account)

A **User** is a Django authentication account (`django.contrib.auth.models.User`). A
`User` may be linked to at most one `Player` record per game (through the `Player.user`
FK). Without a `Player` link, a `User` may still join a game as a GameMaster.

A `User` is **not** scoped to any single game — unlike `Character`, `Player`, and
`GameMaster`, a `User` is a global identity. Its "name" for management purposes is the
Django `username` field; there is no separate first/last name field.

### Character

A **Character** is an in-game persona that belongs to a single game. Characters are
either **Player Characters (PCs)** or **Non-Player Characters (NPCs)**:

- **PC** (`npc=False`): a character owned by a specific `Player`.
- **NPC** (`npc=True`): a character with no player owner (controlled by the game master
  or narrative).

A character has a name, optional avatar, class, level, a public description (visible to
all), and a private description (visible only to editors).

### GameMaster (DM / Dungeon Master)

A **GameMaster** record links a `User` to a `Game`, granting that user full editorial
authority over all characters in that game. A user may be a GameMaster in multiple
games simultaneously, and a game may have multiple GameMasters.

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

A user is a **GameMaster** (DM) for a game when a `GameMaster` record exists with
`game_master.game == character.game` and `game_master.user == user`.

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
GameMaster, GameSession, Task, or the `/games/:game_slug/treasures*` routes remain governed
solely by GameMaster/Superuser, never Staff. Staff also never reaches into
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
3. The user is a **GameMaster** for the same game — i.e. a `GameMaster` record exists
   linking `user` to `character.game`.

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
