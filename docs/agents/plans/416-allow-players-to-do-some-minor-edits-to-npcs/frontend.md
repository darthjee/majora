# Frontend Plan: Allow players to do some minor edits to NPCs

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on backend's `PATCH /games/:game_slug/npcs/:id.json` accepting `{"slain":
true|false}` (writes `public_slain`), permitted for a player of the game or a GM/superuser,
returning the same `CharacterDetailSerializer` shape as the endpoint's `GET`. No backend
change is needed to read `is_player` — it's already returned by the character/game access
endpoints (`AccessStore.ensureCharacterAccess`/`ensureGameAccess`) and simply not merged into
page state today.

Player-facing buttons must call the **plain** endpoint, never `full.json` — `full.json` stays
exclusively for the existing DM edit form / DM slain toggle (per #428).

## Implementation Steps

### Step 1 — Surface `is_player` in the loaded character/page state

- `frontend/assets/js/components/pages/controllers/CharacterController.js:129-132`
  (`fetchAndMergeAccess`): merge `is_player` from the access response into the character
  object too, alongside the existing `can_edit` — `{ ...character, can_edit: access.can_edit,
  is_player: access.is_player }`. This feeds the NPC show page.
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js:92-96`
  (`#fetchAccess`): alongside `setCanEdit`, add an `isPlayer` setter/state fed by
  `access.is_player` from the same `AccessStore.ensureGameAccess` call, threaded through the
  constructor the same way `setCanEdit` already is. This feeds the NPC index page (a
  page-level flag, not per-NPC, same granularity as `canEdit` today).

### Step 2 — Add a player-facing slain-toggle client call

In `frontend/assets/js/client/CharacterClient.js`, add a method (e.g.
`setNpcPublicSlainAsPlayer(gameSlug, characterId, token, slain)`) that PATCHes
`/games/${gameSlug}/npcs/${characterId}.json` (the plain endpoint — not `full.json`, and not
via `updateCharacter`, which now targets `full.json` per #428) with body `{ slain }`. Keep
`setNpcSlain`/`updateCharacter` untouched — those remain the DM-facing calls.

### Step 3 — NPC show page: player toggle

In `frontend/assets/js/components/pages/NpcCharacter.jsx`, add a player-facing counterpart to
`useSlainTogglePair`/`useSlainExtra` (a single toggle, not the DM's pair): shown when
`character.is_player && !character.can_edit`, bound to `character.public_slain`, using the new
client call from Step 2 (not `SlainConfirmController`, which calls `setNpcSlain` →
`full.json`). Reuse `SlainConfirmModal` for the confirmation UI. Wire its handler into
`CharacterHelper.jsx`'s `#buildSecondaryButtons` (`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx:151-174`):
when the DM branch (`character.is_pc || !character.can_edit`) doesn't apply but
`character.is_player` does, render a single button — label/variant driven by
`character.public_slain` (Revive/Mark as Slain, success/danger), using `Icons.heart`/
`Icons.skullFill` (the same filled icons as the DM's real-slain button, confirmed intentional
reuse — see issue #416's icon decision) — bound to the new player-toggle handler instead of
`onOpenSlainModal`.

### Step 4 — NPC index page: player toggle

In `frontend/assets/js/components/pages/GameNpcs.jsx` and
`frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` /
`CharacterCardHelper.jsx`, mirror Step 3 at the card level: thread the new page-level
`isPlayer` state (Step 1) down to `GameCharactersHelper.render`/`CharacterCardHelper` next to
the existing `canEdit`, and render the same single player-facing slain button (gated
`isPlayer && !canEdit`) per NPC card, calling the Step 2 client method with that card's
`public_slain` value via a new handler passed down the same way `onSlainClick`/
`onPublicSlainClick` already are.

### Step 5 — Specs

- `frontend/specs/assets/js/client/CharacterClient/` — new spec for
  `setNpcPublicSlainAsPlayer`, asserting the plain-endpoint URL and body shape (mirroring
  `setNpcSlainSpec.js`'s structure).
- `frontend/specs/assets/js/components/pages/controllers/` — extend
  `CharacterController`/`GameNpcsController` specs to assert `is_player`/`isPlayer` is merged
  from the access response.
- Extend/add specs under `frontend/specs/assets/js/components/pages/helpers/` (`CharacterHelper`,
  `CharacterCardHelper`, `GameCharactersHelper`) covering the new player-only button: shown for
  `is_player`+non-editor, hidden for a plain visitor, not duplicated alongside the DM's two
  buttons when both `can_edit` and `is_player` happen to be true.
- Add/extend a spec for the new `NpcCharacter.jsx` player-toggle hook and its modal wiring.

## Files to Change

- `frontend/assets/js/components/pages/controllers/CharacterController.js` — merge `is_player`.
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` — merge `is_player`
  as page-level `isPlayer` state.
- `frontend/assets/js/client/CharacterClient.js` — new player slain-toggle method.
- `frontend/assets/js/components/pages/NpcCharacter.jsx` — player toggle hook + modal wiring.
- `frontend/assets/js/components/pages/GameNpcs.jsx` — page-level `isPlayer` state + handler.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — player button branch in
  `#buildSecondaryButtons`.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` /
  `CharacterCardHelper.jsx` — player button branch for index cards.
- Corresponding spec files under `frontend/specs/...` mirroring each of the above.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Don't touch `updateCharacter`/`setNpcSlain`/`BaseCharacterEditController` — those stay
  DM-facing and keep targeting `full.json`, unaffected by this issue.
- The player button is single (toggles `public_slain` only) — do not add a second "real slain"
  player button; only DMs ever see/touch the real `slain` field.
- Verify manually in the running app (per this project's `/verify` convention) since this is a
  user-facing permission/UI change: a logged-in player (linked to the game via `Player.games`
  in test data) should see and be able to use the new button; a logged-in non-player,
  non-editor should not.
