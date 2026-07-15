# Issue: Allow Npc Edit

## Description
Players are currently blocked from `/#/games/:game_slug/npcs/:id/edit` — the page redirects
away unless the requester is a `dm`/`admin`, since it gates on the same `can_edit` (backend
`CharacterEditPermission`) used by `PATCH .../full.json`. NPCs have no owning player, so a
regular player is never `can_edit` today.

This issue lets any player of the game reach the NPC edit page too, but restricted to a
narrower, player-safe field set, generalizing the existing narrow-PATCH pattern already used
for the NPC `slain` toggle (issue #416) and NPC photo upload (issue #429).

## Problem
- `PATCH /games/:game_slug/npcs/:id/full.json` (dm/admin only, `CharacterEditPermission`) is the
  only write path for NPCs today. `PATCH /games/:game_slug/npcs/:id.json` (`NpcPlayerEditPermission`)
  exists but only accepts a single field (`slain`, written to `public_slain`).
- The edit page frontend (`CharacterEdit.jsx` / `BaseCharacterEditController`) redirects away
  from the edit page entirely whenever `character.can_edit` is false, which is always the case
  for a plain player viewing an NPC — there is no partial-access path today.
- The edit form (`BaseCharacterEditHelper.jsx`) always renders every field, including
  `private_description`, regardless of what the current viewer is actually allowed to see or
  edit.

## Expected Behavior
- Any player of the game (not just dm/admin) can open `/#/games/:game_slug/npcs/:id/edit`
  instead of being redirected away.
- `PATCH /games/:game_slug/npcs/:id/full.json` stays dm/admin only (`CharacterEditPermission`),
  unchanged.
- When the current user is **not** dm/admin, submitting the edit form sends
  `PATCH /games/:game_slug/npcs/:id.json` (`NpcPlayerEditPermission`) instead of `full.json`.
- On page load, the existing dual-load pattern already used by the show page continues to
  apply: everyone loads the NPC via `GET /games/:game_slug/npcs/:id.json`, and a dm/admin
  additionally loads `GET /games/:game_slug/npcs/:id/full.json` to get the full detail. No
  change needed here — `CharacterController` already implements this for both show and edit
  pages.
- The edit form only shows fields the current user is allowed to see/edit on that NPC:
  - A **player** (non-dm/admin) editor sees and can submit: `public_description`, `links`,
    `allegiance` (writes `public_allegiance`), and the slain toggle (writes `public_slain`).
  - `name`, `role`, `money`, and `private_description` are **not** shown to a player editor —
    dm/admin only, via `full.json` as today.

## Solution
### Backend
- Broaden the write serializer behind `PATCH /games/:game_slug/npcs/:id.json`
  (`NpcSlainUpdateSerializer`, `backend/games/serializers/characters/npcs/npc_slain_update.py`)
  to also accept `public_description`, `links`, and `allegiance` (source `public_allegiance`),
  alongside the existing `slain` (source `public_slain`) field. Keep it gated by the existing
  `NpcPlayerEditPermission` (`backend/games/permissions.py`) — no permission changes needed,
  since that permission already grants access to any player of the game, on top of the usual
  dm/admin/superuser `can_be_edited_by` rule.
- `PATCH /games/:game_slug/npcs/:id/full.json` (`CharacterEditPermission`,
  `CharacterUpdateSerializer`) is untouched.
- Update `docs/agents/access-control/character.md` in the same PR to document the widened
  narrow-PATCH field set.

### Frontend
- `BaseCharacterEditController` / `CharacterEdit.jsx`: stop redirecting away from the edit page
  when the viewer is a player of the game, even though `can_edit` (dm/admin) is false. Introduce
  a distinct signal for this narrower access (e.g. the existing `is_player` flag already merged
  onto the character via `CharacterController#fetchAndMergeAccess`), alongside the existing
  `can_edit` (dm/admin, backed by `full.json`).
- Branch `submitForm`: dm/admin editors keep PATCHing `full.json` via
  `CharacterClient#updateCharacter` as today; a player-only editor instead PATCHes
  `npcs/:id.json` with just `{ public_description, links, allegiance, slain }`.
- `BaseCharacterEditHelper.jsx`: conditionally render `name`, `role`, `money`, and
  `private_description` inputs only when the current viewer is a full (dm/admin) editor —
  fixing the existing gap where `private_description` is always rendered regardless of role.

### Out of scope
- Populating `Player.games` so `is_player` evaluates `true` for real users in production — this
  is a pre-existing, separately tracked gap (per
  `docs/agents/access-control/common-rules.md`), not something this issue needs to fix. This
  issue builds on the `NpcPlayerEditPermission`/`is_player` mechanism as it exists today.

## Benefits
- Lets players collaborate on NPCs they can already partially see — updating public
  description, links, perceived allegiance, and slain state — without exposing dm-only data
  (`private_description`, `name`, `role`, `money`) or dm-only write paths.
- Generalizes the existing narrow player-edit pattern (`slain` toggle from #416, photo upload
  from #429) to a slightly larger, still-curated field set, rather than introducing a new,
  parallel permission model.
