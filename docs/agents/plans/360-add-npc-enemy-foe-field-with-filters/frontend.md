# Frontend Plan: Add NPC enemy/foe field with filters

Main plan: [plan.md](plan.md)

## Shared contracts

- Every character payload the frontend receives (list or detail, public or DM/admin) carries a
  single `allegiance` key (`"ally"` / `"enemy"` / `"neutral"`) already resolved server-side to
  the value the current user is authorized to see — the frontend never needs to choose between
  `allegiance`/`public_allegiance` itself, it always just reads `character.allegiance`.
- Border rendering applies **only** to NPCs (`characterType === 'npc'` on the card,
  `!character.is_pc` on the detail page) — PCs never render the border, even though the
  `allegiance` key is technically present on their payload too (see backend plan notes).

## Implementation Steps

### Step 1 — Allegiance-to-border-class mapping

Add a small helper (e.g. a `static #borderClassFor(allegiance)` private method, colocated in
`CharacterCardHelper.jsx`, or a tiny shared util under `assets/js/utils/` if it ends up needed in
more than one helper — check after Step 2/3 whether sharing is worth it) mapping:

- `'ally'` → `'border-success'`
- `'enemy'` → `'border-danger'`
- anything else (`'neutral'` or missing) → `'border-secondary'`

### Step 2 — NPC index card border

In `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`, apply the border
class to the card wrapper (`<div className="card h-100">` inside `render`) when
`characterType === 'npc'`, driven by `character.allegiance`. PCs keep the plain `card h-100`
class, unaffected.

Update the JSDoc `@param {string} [character.allegiance]` on `CharacterCard.jsx` and
`CharacterCardHelper.jsx` to document the new field.

### Step 3 — NPC show-page picture border

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, wrap the
`PhotoUploadOverlay` (the "picture", not the surrounding `col-md-4` column, which also holds the
name/links/money) in a bordered `<div>` when `!character.is_pc`, driven by `character.allegiance`,
using the same class mapping as Step 1 (share the helper if it was extracted broadly enough in
Step 1, otherwise duplicate the small mapping — judge based on final Step 1 shape and existing
project tolerance for small per-file duplication vs. a shared util).

Update the JSDoc `@param {string} [character.allegiance]` on `CharacterHelper.render`.

## Files to Change

- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — border class on the
  NPC card.
- `frontend/assets/js/components/elements/CharacterCard.jsx` — JSDoc update only.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — border wrapper around the
  NPC show-page picture.
- Possibly a new small shared util (e.g. `frontend/assets/js/utils/AllegianceBorder.js`) if the
  mapping is reused identically in both places — prefer this over duplicating the 3-way mapping.

## Tests to add/update

- `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` — border
  class applied for `ally`/`enemy`/`neutral`/missing `allegiance` on NPC cards, and confirm PCs
  never get a border class regardless of `allegiance`.
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelper/` — new spec file (e.g.
  `allegianceBorderSpec.js`, following the existing one-concern-per-file convention in that
  folder) covering the same three cases on the NPC show page, and confirming PCs are unaffected.
- If a shared util is extracted, add its own spec file under `frontend/specs/assets/js/utils/`.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend tests)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)

## Notes

- No new user-facing copy/strings are introduced (colors only), so no translation work is
  needed for this issue.
- `character.allegiance` is present on PC payloads too (see backend plan) but must never drive
  any visible styling on PC pages/cards — gate strictly on `characterType`/`is_pc`, not on the
  mere presence of the field.
