# Frontend Plan: Refactor public slain and allegiance

Main plan: [plan.md](plan.md)

## Shared contracts

Build against the response/write-payload keys and filter query params documented in [plan.md](plan.md)'s "Character field & endpoint contract" — the backend agent is renaming `slain`/`allegiance` to `private_slain`/`private_allegiance` and dropping all public-endpoint aliasing to match. Decide the definitive i18n old-key → new-key mapping as you go (see Step 5) and hand it to the translator agent per [plan.md](plan.md)'s second contract.

## Implementation Steps

### Step 1 — Add a private-with-public-fallback resolver

Today, several places read `character.slain`/`character.allegiance` directly, relying on the backend's aliasing to make that field mean "whichever value this viewer is allowed to see." Once the backend stops aliasing, that field won't exist for non-editors. Per the issue's pseudo-code, add a resolver that prefers the private value and falls back to the public one when the private value is absent (e.g. for a player, whose payload only ever carries `public_slain`/`public_allegiance`):

- `frontend/assets/js/components/common/list_types/BaseListItem.js` (or a small new shared utility, if a plain function is more reusable — see below) — add `getSlain()`/`getAllegiance()`-shaped accessors implementing `private_* ?? public_*` fallback, per the issue's `CharacterDataWrapper` pseudo-code.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx` and `frontend/assets/js/components/common/cards/CharacterPreviewCard.jsx` operate on a raw `character` object, not a `BaseListItem`-wrapped item, so they can't call the wrapper's getters directly. Either factor the same `private_* ?? public_*` logic into a small plain utility function both the wrapper class and these components import, or wrap the character object earlier in the call chain — your call; just don't duplicate the fallback logic ad hoc in each caller.

### Step 2 — Wire the resolver into slain/allegiance-derived UI

Replace every direct `character.slain`/`character.allegiance` (or `item.data.slain`/`item.data.allegiance`) read used to derive *display* state with the Step 1 resolver:

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx`: `grayscale={character.slain}` (line ~44) and the border's `allegianceBorderClass(character.allegiance)` (line ~55, `CharacterAvatarHelper.render`).
- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js`: `buildNpcActionBarProps`'s `grayscale: Boolean(character.slain)` and `buildNpcCardClassName`'s `allegianceBorderClass(item.data.allegiance)`.
- `frontend/assets/js/components/common/cards/CharacterPreviewCard.jsx` (game-show-page PC/NPC shortlists): same fallback for whatever it currently reads off `character.slain`/`character.allegiance`. Verify what data this card's list actually receives (which endpoint backs the shortlist) before assuming `private_*` is ever present there — if the shortlist only ever fetches the public list endpoint regardless of viewer, the private half of the fallback is simply always absent there, which is fine (falls through to public).

### Step 3 — Split the slain buttons onto the renamed fields

`frontend/assets/js/components/common/list_types/SlainSecondaryButtons.js` already builds a DM-facing pair (`buildDmButtons`) and a single player-facing button (`buildSlainButton`) — the two-button DM UI already exists, it's the *field* each button is bound to that's wrong post-rename:

- `CharacterAvatarHelper.jsx`'s `#buildDmSecondaryButtons`/`#buildPlayerSecondaryButtons` and `characterListTypes.js`'s `buildNpcSecondaryButtons`: the DM's "real" button must read/toggle `character.private_slain` (not `character.slain`); the public button already correctly reads `character.public_slain`. The single player-facing button must read/toggle `character.public_slain` directly (not `character.slain` — today it deliberately reuses `character.slain` because that's what the backend used to alias for non-editors; that alias is gone).
- Confirm the icon set in `frontend/assets/js/utils/ui/Icons.js` against the issue's spec: private button = `skull-fill`/`heart-fill` (already `Icons.skullFill`/`Icons.heart`, since `Icons.heart` resolves to `bi-heart-fill`), public button = `skull-lines`/`heart` (currently `Icons.skull`/`Icons.heartOutline`, i.e. `bi-skull`/`bi-heart`). There is no `bi-skull-lines` icon defined today — treat the issue's "skull-lines" as the existing `Icons.skull` (`bi-skull`) unless you find evidence a distinct glyph is wanted; the icons otherwise already match the spec, so this is a naming double-check, not a new icon addition.
- Update whatever handlers build the PATCH payloads for these buttons so the private button sends `private_slain` (via the `full.json` endpoint) and both the DM's and the player's public button send `public_slain` (public patch endpoint), per the backend contract.

### Step 4 — Allegiance selects: gate by role

`frontend/assets/js/components/resources/character/pages/elements/show/CharacterAllegianceFieldsSlot.jsx`'s `buildCharacterAllegianceFields` renders **both** selects unconditionally today — there is no role gating at all, which is exactly the "component visibility" bug the issue describes. Add a `canEdit` (DM/admin) flag to the props this slot receives (threaded from `npcShowType.js`'s config, alongside how other role-gated slots in that file already get their context) and only render the private-allegiance select when `canEdit` is true; players/staff see only the public-allegiance select.

Update `frontend/assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js` accordingly:
- `fieldsFromCharacter`: rename the `allegiance`/`public_allegiance` fallback pair to `private_allegiance`/`public_allegiance` (private falls back to public when absent, e.g. for a player-only load that never carries `private_allegiance`).
- `fullEditorFields`: send `fields.private_allegiance` (renamed from `fields.allegiance`) to `full.json`.
- `playerFields`: send `public_allegiance`/`public_slain` as the wire keys (renamed from `allegiance`/`slain`), matching the renamed `NpcPlayerUpdateSerializer`.

### Step 5 — NPC filters: split public/private, rename query params

`frontend/assets/js/components/resources/character/pages/elements/NpcFilters.jsx` (+ `NpcFiltersController.js` + `NpcFiltersHelper.jsx`) today has one Status (slain) dropdown and one Allegiance dropdown, sent as query params `slain`/`allegiance`, with only the (unrelated) Hidden dropdown gated by `canEdit`.

- Rename the query params the public-facing filters send/read from `slain`/`allegiance` to `public_slain`/`public_allegiance` (per the backend contract), updating `NpcFiltersController.buildQuery`/`slainToStatus`/`statusToSlain` and the hash-param reads in `NpcFilters.jsx`.
- Add a second Status dropdown and a second Allegiance dropdown for the private values, gated by `canEdit` (mirroring how the Hidden dropdown is already gated), sending/reading `private_slain`/`private_allegiance`.
- Update the corresponding i18n keys (see Step 6) and `NpcFiltersHelper.jsx`'s rendering.

### Step 6 — Decide the i18n key renames

As you touch each component above, decide the exact old-key → new-key mapping (e.g. `npc_edit_page.allegiance_label` → `private_allegiance_label`, plus new keys for the two added private filters and new/renamed slain-button keys if any change). Keep the English text identical — only keys change. Hand the finished mapping to the translator agent; do not edit `frontend/assets/i18n/*.yaml` yourself.

### Step 7 — Update frontend specs

Update the ~42 spec files under `frontend/specs/` referencing `slain`/`allegiance` (component props, fixture data, expected payloads, filter query params) to match the renamed fields/keys above.

## Files to Change

- `frontend/assets/js/components/common/list_types/BaseListItem.js` (or a new small utility) — private-with-public-fallback resolver.
- `frontend/assets/js/components/common/list_types/NpcListItem.js` — wire the resolver in, if added as instance getters there.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx` — grayscale/border/button field renames.
- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js` — `buildNpcActionBarProps`/`buildNpcCardClassName`/`buildNpcSecondaryButtons` field renames.
- `frontend/assets/js/components/common/list_types/SlainSecondaryButtons.js` — icon/field audit.
- `frontend/assets/js/components/common/cards/CharacterPreviewCard.jsx` — shortlist fallback.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterAllegianceFieldsSlot.jsx` — role-gated selects.
- `frontend/assets/js/components/common/show_page/show_types/configs/npcShowType.js` — thread `canEdit` into the allegiance fields slot.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js` — field renames in seed/payload builders.
- `frontend/assets/js/components/resources/character/pages/elements/NpcFilters.jsx`, `elements/controllers/NpcFiltersController.js`, `elements/helpers/NpcFiltersHelper.jsx` — split public/private filters, renamed query params.
- Mirrored files under `frontend/specs/` for every file above (~42 existing spec files reference `slain`/`allegiance`).

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, JS lint step)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`, translations step — will fail until the translator agent's changes land too)

## Notes

- PCs have no allegiance/slain UI today (no selects, no filters, no picture buttons) and this issue doesn't add any — only the underlying `Character` model fields are shared with PCs; the frontend changes above are NPC-only, matching current behavior.
- Confirm before assuming: whether the game-show-page shortlist (`CharacterPreviewCard.jsx`) ever receives `private_*` fields for a DM viewer, or always only the public list data regardless of viewer — this determines whether Step 1's fallback ever actually has a private value to prefer there.
