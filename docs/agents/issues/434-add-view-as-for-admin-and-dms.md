# Issue: Add view as for admin and DMs

## Description

Depends on #433 (splits `.../access.json`/`.../permissions.json` and adds a `role` query
parameter to `permissions.json` for computing permissions under a simulated role instead
of the requester's real identity).

Today, an authenticated Superuser or Staff member always sees the frontend exactly as
their real role allows — which for a Superuser is every button and page, since
`can_be_edited_by` treats superusers as able to edit everything. There is no way for an
admin or staff member to preview how the app looks/behaves for a lesser-privileged user
(a DM, a player, or an anonymous visitor) without actually logging in as one.

The backend already re-enforces every permission check server-side regardless of what
the frontend renders (`_EditPermission` and friends in `source/games/permissions.py`), so
this is purely a frontend rendering concern — no backend authorization logic changes.

## Problem

Admins and staff cannot see what a lesser-privileged user would see in the frontend —
they can only ever exercise their own (fuller) view. This makes it hard to verify how a
page behaves for a DM, a player, or an anonymous visitor without a second real account
of that role.

## Solution

### Header button

A new button, next to "my account," visible only to Superusers and Staff based on their
**real** role — regardless of any facade currently active. Uses bootstrap icon class
`bi-file-person-fill`. Opens a modal.

### Modal

- A checkbox to turn the facade on/off.
- A list of roles, each with its own checkbox (a facade can simulate more than one role
  at once): `dm`, `player`, `owner` — the same simulatable roles #433 accepts on
  `permissions.json`'s `role` query parameter. `owner` only changes anything when
  viewing a PC page (per #433, it's a documented no-op everywhere else — games, NPCs,
  treasures, sessions, tasks have no ownership concept), but is still offered as a
  checkbox so an admin can preview a PC's own-player view.
- "Cancel" closes the modal without actually applying any change.
- "Save" sends the chosen facade state to `AccessStore`.

### `AccessStore` changes (`frontend/assets/js/utils/AccessStore.js`)

- Stores both the user's real role information and the currently mocked/simulated
  facade; every per-resource access/permissions check picks whichever is active.
- Gains methods to change the facade (update the simulated role set, or turn the facade
  on/off entirely).
- The facade persists across page navigation (survives `syncForRoute`, unlike the
  per-resource cache itself), but lives in memory only — a full page reload or new
  browser session resets it back to the user's real role.
- Changing the facade triggers the same event `AccessStore` already emits when a real
  access/permissions fetch resolves, so any component listening for access changes
  re-renders immediately, without a page reload.
- Gains a method reporting whether the user **really** is admin/staff (server-verified,
  unaffected by any active facade) — used to gate the header button itself.

### Scope

The facade only affects per-resource permission/identity rendering — i.e. anything
driven by `AccessStore.ensure*Access`/`ensure*Permissions` (`can_edit`, `is_dm`,
`is_player`, `is_owner` on game/character/treasure pages). It does **not** affect global
nav-link visibility or admin-only page guards (e.g. the "Treasures"/"Staff Users" nav
links, or the redirects in `TreasuresController`/`TreasureNewController`/
`TreasureEditController`/`StaffUsersController`/`StaffUserController`/
`StaffUserEditController`) — those keep reading the real, server-verified
superuser/staff status (`AccessStore.ensureSuperUser`/`ensureStaffOrSuperUser`),
unaffected by any active facade, same as the header button itself.

### Behavior

- A simulated role changes what the frontend renders (buttons, page content) via the
  `role` query parameter introduced by #433's `permissions.json`. It never changes what
  a request is actually allowed to do — the backend still authorizes every write against
  the requester's real identity.
- Example (admin): while simulating "player," the admin sees the same buttons a player
  would see; clicking one issues the same request a player's click would, which succeeds
  because the admin's real identity (superuser) is authorized for everything anyway.
- Example (staff): while simulating "DM," staff sees the DM's buttons on an NPC page —
  but using them still fails server-side, since staff's real identity isn't actually that
  game's GameMaster. Likewise, staff would see the NPC's full-detail page as a DM would,
  but the underlying `GET /games/:game_slug/npcs/:id/full.json` fetch still 404s for
  staff's real identity; the frontend must treat that 404 as an absence of extra data
  (already how `CharacterController` handles a non-OK `full.json` response today), not an
  error.

## Benefits

- Admins and staff can verify how the app behaves and looks for a lesser-privileged user
  without needing a second real account.
- No backend authorization changes — the facade is a purely client-side rendering
  convenience, so there is no new security surface to review on the write path.
- Builds directly on the `role`-simulation groundwork already planned in #433, reusing
  the same `permissions.json` mechanism rather than introducing a second one.
