# Frontend Plan: Allow Npc Edit

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the widened `PATCH /games/:game_slug/npcs/:id.json` body described in
[plan.md](plan.md)'s "Shared contracts" section (`public_description`, `allegiance`, `slain`,
`links`), sending only that subset when the current viewer is a player-only editor. Continues
sending the full field set to `full.json` via the existing `CharacterClient#updateCharacter`
when the viewer is dm/admin, unchanged. Relies on `character.is_player` /
`character.can_edit`, both already merged onto the loaded character by
`CharacterController#fetchAndMergeAccess` (`.../pages/controllers/CharacterController.js`) — no
new access-endpoint field needed.

## Implementation Steps

### Step 1 — Stop redirecting player-only viewers off the edit page

`BaseCharacterEditController.#shouldRedirect` (private static, in
`.../pages/controllers/BaseCharacterEditController.js`) currently redirects whenever
`character.access_resolved && !character.can_edit`. Change the condition so a player of the game
(`character.is_player`) is also allowed to stay, e.g. redirect only when
`access_resolved && !can_edit && !is_player`. Do the equivalent for the inline gate at
`CharacterEdit.jsx`'s `if (!character || !character.can_edit) return EditHelper.renderLoading();`
(line ~75) — likely becomes `!character || (!character.can_edit && !character.is_player)`. This
applies to both NPC and PC edit pages since the component is shared
(`characterKind`-parameterized) — for PCs, `is_player` should have no additional effect beyond
today's behavior (PCs already grant `can_edit` to their owning player; a non-owner player gets
no extra access here, since the narrower player-edit endpoint is NPC-only).

### Step 2 — Add a client method for the widened player-editor PATCH

`CharacterClient` (`frontend/assets/js/client/CharacterClient.js`) already has
`setNpcPublicSlainAsPlayer(gameSlug, characterId, token, slain)` (PATCHes
`/games/${gameSlug}/npcs/${characterId}.json` with `{ slain }`), used today by the show page's
`PlayerSlainConfirmController` — leave that method and its call site untouched, it's a distinct,
already-shipped feature. Add a new method (e.g. `updateNpcAsPlayer(gameSlug, characterId, token,
fields)`) that PATCHes the same endpoint with an arbitrary partial body
(`public_description`/`allegiance`/`slain`/`links`), for the edit page to call. Consider having
`setNpcPublicSlainAsPlayer` delegate to this new method internally to avoid duplicating the
endpoint path string, but this is not required.

### Step 3 — Branch the edit page's submit logic

`BaseCharacterEditController.submitForm`/`handleSubmit`
(`.../pages/controllers/BaseCharacterEditController.js`) currently always builds the full fields
object (`name`, `role`, `public_description`, `private_description`, `money`, `links`, plus
`allegiance`/`public_allegiance` for NPCs) and PATCHes `full.json` via `updateCharacter`. Branch
on whether the current viewer is a full editor (`can_edit`) vs a player-only editor
(`is_player && !can_edit`, NPCs only — `routeSegment === 'npcs'`):

- Full editor (dm/admin): unchanged — build the full fields object, PATCH `full.json`.
- Player-only editor (NPC only): build a reduced fields object — `public_description`,
  `allegiance` (maps to the wire-level `allegiance` key, backend sources it from
  `public_allegiance`), `links` (via the existing `#linksPayload` helper), and `slain` (from
  whatever the form's slain-toggle control is/becomes — see Step 4) — and PATCH via the new
  `updateNpcAsPlayer` client method instead of `updateCharacter`.

`applyLoadedCharacter`'s `#fieldsFromCharacter` seeding stays the same either way — the loaded
character already carries `public_description`/`allegiance` etc. regardless of editor kind (the
dual-load in Step 5/`CharacterController` only adds the DM-only fields on top for a full editor).

### Step 4 — Conditionally render form fields by editor kind

`BaseCharacterEditHelper.jsx` (`.../pages/helpers/BaseCharacterEditHelper.jsx`) currently renders
one fixed form: `name`, `role`, public/private description, `money`, `links`, and (NPC-only)
allegiance fields — with no gating by role at all, so `private_description` is always rendered
even when the loaded character never actually carried a real value for it (a pre-existing gap).
Thread an `isFullEditor` (or equivalent) flag through from `CharacterEdit.jsx`
(`character.can_edit`) down to the helper's `render(...)` call, and:

- Hide `name`, `role`, `money`, and `private_description` inputs entirely when `!isFullEditor`.
- Keep `public_description`, `links`, allegiance, and the slain toggle visible/editable
  regardless of editor kind (NPC-only fields already gated on `idPrefix === 'npc'` — no change to
  that condition, just add the `isFullEditor` gate on top for the DM-only fields).
- A slain-toggle control needs to exist in this form (today the toggle only lives on the show
  page via `PlayerSlainConfirmController`) — reuse that same
  `public_slain` semantics/labeling for consistency, gated to render for both editor kinds
  (dm/admin can already set it via `full.json`'s `slain`/`public_slain` pair; a player sets it via
  the new reduced PATCH's `slain` key).

### Step 5 — No change needed to the load/dual-load pattern

`CharacterController#loadCharacter` → `fetchAndMergeAccess` → `loadFullCharacter` already fetches
`full.json` only `if (character.can_edit)` and otherwise keeps the plain-detail character as-is —
this is shared by both the show and edit pages today (`NpcCharacterEditController` reuses
`NpcCharacterController` as its `loadController`). No changes needed here; confirm with a spec
that a player-only editor's edit page renders using just the plain-detail fields (no
`private_description` leak).

### Step 6 — Translations

Check `frontend/assets/i18n/` for any new label needed by the edit-page slain toggle (Step 4) —
if the show page's existing slain-toggle copy can be reused verbatim, no new key is needed;
otherwise add one key per language file and run the translation-sync check (delegate to the
`translator` agent/skill if new keys are needed).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`
  — redirect condition, submit branching, reduced-fields payload for player-only editors.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — loading
  gate condition, pass `isFullEditor`/editor-kind down to the helper.
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx`
  — conditional field rendering, slain-toggle control in the form.
- `frontend/assets/js/client/CharacterClient.js` — new `updateNpcAsPlayer` method (or equivalent
  generalization).
- Matching specs under `frontend/specs/assets/js/...` for every file above (this repo's
  convention mirrors `assets/js` 1:1 under `specs/`).

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend test suite)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)

## Notes

- Keep the PC edit page's behavior unchanged — the `is_player`-based relaxation only matters for
  NPCs (`routeSegment === 'npcs'`); a PC's `can_edit` already covers its owning player.
- `is_player` currently always reads `false` for every real user in production (per
  `docs/agents/access-control/common-rules.md` — `Player.games` is never populated by any
  endpoint yet). This is out of scope for this issue (see [plan.md](plan.md)); this work is
  still worth landing since it activates automatically once that gap is closed, and it's already
  directly testable with a `Player.games`-seeded fixture in specs/tests.
