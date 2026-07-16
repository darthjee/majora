# Issue: Player should be able to edit NPC

## Problem

Right now, when visiting a character page `/#/games/:game_slug/npcs/:id`, players cannot see the Edit button, even though they can reach the edit page directly at `/#/games/:game_slug/npcs/:id/edit`.

This is purely a frontend gap: the backend's partial PATCH endpoint (`PATCH /games/:game_slug/npcs/:id.json`) already permits any player of the game to update an NPC. The Edit button's visibility (and the private-field loading it triggers) is driven by a single `can_edit` flag from the backend's `permissions.json`, which today only reflects "full edit" (dm/admin) permission — there is no lower-tier "general edit" permission exposed to the frontend at all.

Players should be able to do partial updates, while dms and admins should retain full update power.

## Solution

We need two distinct, named permission tiers: "general edit" (dm, player, admin) and "full edit" (dm, admin). A prior issue (#445, "Allow Npc Edit") already built most of the general-edit tier's plumbing — this issue closes the remaining gaps rather than introducing the concept from scratch.

Concretely, the backend already exposes a per-game "is this user a player of this game" flag (`is_player`, from the character access endpoint), and the frontend already copies it onto the loaded character (`character.is_player`, in `CharacterController#mergeAccess`). That flag already drives: staying on the NPC edit page instead of being redirected away, and submitting through the narrower player-writable NPC endpoint instead of the full one. No new backend permission flag is needed — the fix is to also use this existing flag to gate the Edit button, and to widen both the player-writable field set (backend) and the player-editable form fields (frontend) to include `name`/`role`.

### General edit permission
Access to the partial patch endpoint `PATCH /games/:game_slug/npcs/:id.json`.

- Grants access to the Edit button on `/#/games/:game_slug/npcs/:id`
- Grants access to the edit page `/#/games/:game_slug/npcs/:id/edit`
- Grants access to the partial edit endpoint `PATCH /games/:game_slug/npcs/:id.json`
- Grants access to the partial get endpoint `GET /games/:game_slug/npcs/:id.json`

**Allowed to:** dm, player, admin
**Current status:** already implemented on the backend (`NpcPlayerEditPermission`) for the partial PATCH/GET endpoints, and mostly wired on the frontend (edit-page access, form submission routing) via the existing `is_player` flag. Remaining gaps: the show-page Edit button doesn't check `is_player` yet, and `name`/`role` are excluded from both the partial-patch serializer and the player-editable form fields.

### Full edit permission
Access to the full patch endpoint `PATCH /games/:game_slug/npcs/:id/full.json`.

- Grants access to the Edit button on `/#/games/:game_slug/npcs/:id`
- Grants access to the edit page `/#/games/:game_slug/npcs/:id/edit`
- Grants access to the full patch endpoint `PATCH /games/:game_slug/npcs/:id/full.json`
- Grants access to the full get endpoint `GET /games/:game_slug/npcs/:id/full.json`

**Allowed to:** dm, admin
**Current status:** already implemented (`CharacterEditPermission` / `Character#can_be_edited_by`) for the full PATCH/GET endpoints.

### Redundancy
Anyone with "Full edit permission" also has "General edit permission" — dm and admin can use either endpoint (useful when "view as" is triggered).

### Field aliasing: slain/allegiance vs public_slain/public_allegiance
The model has two independent pairs of fields: a private pair (`slain`, `allegiance` — the DM's true, possibly-hidden knowledge) and a public pair (`public_slain`, `public_allegiance` — what's currently known to players). Full editors (dm/admin) see and edit both pairs directly, under their real names, alongside `private_description`.

Players never see the private pair or the raw `public_*` names. On the partial channel, the wire keys `slain` and `allegiance` are aliased to the public pair: a player-submitted `slain` is saved as `public_slain`, and a player-submitted `allegiance` is saved as `public_allegiance`. The partial GET endpoint does the same in reverse, returning `public_slain` as `slain` and `public_allegiance` as `allegiance`. This keeps the player-facing component simple (one "slain"/"allegiance" toggle) while dm/admin's full-editor view manages the private/public split explicitly.

### PATCH fields
Partial and full patch endpoints have different writable field sets.

#### Full patch endpoint — `PATCH /games/:game_slug/npcs/:id/full.json`
name, role, public_description, private_description, links, money, slain, public_slain, allegiance, public_allegiance, hidden

*(already matches the current `CharacterUpdateSerializer`.)*

#### Partial patch endpoint — `PATCH /games/:game_slug/npcs/:id.json`
name, role, public_description, links, slain (saved as `public_slain`), allegiance (saved as `public_allegiance`)

*(`money` stays full-editor-only — not writable via the partial endpoint. `name` and `role` are a permission expansion: today's partial-patch serializer excludes them, treating them as full-editor-only; this issue adds them to the player-writable set.)*

### GET fields
Partial and full get endpoints have different field sets.

#### Full get endpoint — `GET /games/:game_slug/npcs/:id/full.json`
id, name, role, public_description, private_description, is_pc, links, game_slug, profile_photo_path, profile_photo_id, money, slain, public_slain, allegiance, public_allegiance, hidden

#### Partial get endpoint — `GET /games/:game_slug/npcs/:id.json`
id, name, role, public_description, is_pc, links, game_slug, profile_photo_path, profile_photo_id, money, slain (returned from `public_slain`), allegiance (returned from `public_allegiance`)

*(both GET endpoints already match this today, and both also currently return an extra `can_edit` field not listed above — kept as-is, unaffected by this issue.)*

### PC counterpart
Same idea for PCs, with different access levels:

- `GET /games/:game_slug/pcs/:id/full.json` — dm, admin, owner *(already implemented)*
- `GET /games/:game_slug/pcs/:id.json` — anyone *(already implemented)*
- `PATCH /games/:game_slug/pcs/:id/full.json` — dm, admin, owner *(already implemented)*
- `PATCH /games/:game_slug/pcs/:id.json` — this endpoint does not currently exist. Per the original scope, no PC partial-PATCH endpoint will be added.

### Components
Some components are restricted, to match what a user can see with what a user can edit.

#### NPC Show page `/#/games/:game_slug/npcs/:id`
- Edit Button — dm, admin, player
- private_description — dm, admin only (players never receive this field; see field aliasing above for slain/allegiance)

#### NPC Edit page `/#/games/:game_slug/npcs/:id/edit`
- private_description — dm, admin only

#### PC Show page `/#/games/:game_slug/pcs/:id`
- Edit Button, private_description — dm, admin, owner

#### PC Edit page `/#/games/:game_slug/pcs/:id/edit`
- private_description — dm, admin, owner
