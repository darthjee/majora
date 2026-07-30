# Ownership Chain

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

# GameMaster Role

A user is a **GameMaster** (DM) for a game when a `Player` record exists with
`player.game == character.game`, `player.user == user`, and `player.is_dm is True`.

GameMasters can edit any character in their game — PCs and NPCs alike.

The GameMaster role is **game-scoped**: being a DM in one game grants no authority in
any other game.

---

# Staff Role

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

Staff gains **no** authority over any game-scoped **editing** action — Character,
GameSession, Task, or the `/games/:game_slug/treasures*` write routes remain governed
solely by GameMaster/Superuser, never Staff. Staff also never reaches into
Django-admin-only actions (e.g. Treasure or Game deletion — see
[access-control.md](access-control.md)'s existing admin carve-out), regardless of how far
the Staff role's endpoint-level parity with Superuser grows.

Two explicit, named exceptions to this game-scoped carve-out exist:

- (Issue #619) Staff may upload a photo for a **PC**
  (`POST /games/:game_slug/pcs/:id/photo_upload.json`), for any game, without being a
  player or GameMaster of that game. This does not extend to NPC photo upload
  (`NpcPlayerEditPermission` is unchanged and still has no Staff bypass) nor to any other
  game-scoped resource.
- (Issue #589) Staff may list a game's **players roster**
  (`GET /games/:game_slug/players.json`), for any game, without being a player or
  GameMaster of that game — `PlayerPermission`, the same `is_superuser or is_staff or
  game.players.filter(user=user).exists()` shape already used by `PollPermission`/
  `SessionMessagePermission`'s view checks. This is read-only (List is the only endpoint
  `Player` exposes) and does not grant Staff any edit capability over `Player` or
  `Character` rows.

---

# Editing Rules

A user may edit a character when **any** of the following is true:

1. The user is a **superuser** (`user.is_superuser is True`) — full access everywhere.
2. The user is the character's **owner** per the Ownership Chain above.
3. The user is a **GameMaster** for the same game — i.e. a `Player` record links `user`
   to `character.game` with `is_dm=True`.

Any other authenticated or unauthenticated user may not edit the character.

This logic is implemented in `Character.can_be_edited_by(user)` and
`Character.is_editor(user)` in `backend/games/models/character.py`.

Separately, and narrower in scope (issue #416, widened by issue #445; wire keys renamed from
`allegiance`/`slain` to `public_allegiance`/`public_slain` by issue #861): a user who is a
**player of the game** — the same `is_player` computation exposed on `.../access.json`
endpoints, i.e. a `Player` record linked to `character.game` via `Player.games` whose `user`
matches the requester — may update an NPC's `public_description`, `links`, `public_allegiance`,
and `public_slain` through `PATCH /games/:game_slug/npcs/:id.json`, even without satisfying any
of the three rules above. This is not a general editing right: it grants no access to `name`,
`role`, `money`, `private_description`, `private_allegiance`, or `private_slain`, and does not
apply to PCs. It exists alongside (not instead of) the rules above, so a GameMaster/superuser can
still use the same endpoint.

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

# Summary Table

| Concept | Key rule |
|---------|---------|
| Character owner | `character.player.user` — null if either FK is null |
| GameMaster scope | Per-game; no cross-game authority |
| Editing rights | Superuser OR owner OR GameMaster of same game |
| PC vs NPC | `npc=False` → PC (has player); `npc=True` → NPC (no player) |
| Player account link | `Player.user` nullable — player without a login has no owner |
| Player PC ownership | Zero or one — `unique_player_character` plain `UniqueConstraint` on `Character.player`, no `condition=` (MySQL doesn't support it; unnecessary anyway since MySQL already trea[...] |
| Staff role | `user.is_staff` — global; full parity with Superuser on any non-game-scoped endpoint (User management, global Treasure management); no authority over game-scoped editing, with two nam[...] |
| NPC narrow player PATCH | Any player of the game (via `Player.games`), in addition to the Editing rights above — NPC-only; `public_description`, `links`, `allegiance` (→`public_allegiance`), `sl[...] |
| NPC photo upload (init/finalize) | Any player of the game (via `Player.games`), in addition to the Editing rights above — NPC-only, same `NpcPlayerEditPermission` as the narrow player PATCH row ab[...] |
| PC photo upload (init) | Any player of the game (via `Player.games`), OR any Staff account (`user.is_staff`, global), in addition to the Editing rights above — PC-only, new `CharacterPhotoUploadPe[...] |
| Character money edit | Editing rights above (superuser, owner, GameMaster), OR any Staff account (`user.is_staff`, global), OR — PC-only — any player of the game (issue #625); NPCs get no player[...] |
| Player roster List | Player of the game, GameMaster, Superuser, OR any Staff account (`user.is_staff`, global) — `PlayerPermission` (issue #589), gates `GET /games/:game_slug/players.json`; read-o[...] 

