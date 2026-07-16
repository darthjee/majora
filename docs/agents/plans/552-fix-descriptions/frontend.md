# Frontend Plan: Fix descriptions

Main plan: [plan.md](plan.md)

## Shared contracts

`DescriptionBox` must call `Translator.t('description_box.show_more')` and
`Translator.t('description_box.show_less')` for its toggle button label — these exact key names,
under a new top-level `description_box:` i18n namespace (not nested under an existing page's
keys, since the component is shared across `game_page` and `character_full_page`). The translator
agent adds the actual YAML entries in both locale files; `Translator.t()` falls back to the raw
key when a translation is missing, so this side can be built and tested independently.

## Implementation Steps

### Step 1 — Create the shared `DescriptionBox` component

Current state (confirmed by reading the code):
- `pc`/`npc` `public_description` already renders via `CharacterDescriptionHelper.render()`
  (`resources/character/pages/elements/helpers/CharacterDescriptionHelper.jsx`): a
  `<div className="mt-3 p-3 border rounded bg-light text-pre-wrap">{description}</div>`.
- `pc`/`npc` `private_description` already renders via `CharacterDmNotesHelper.render()`
  (`resources/character/pages/elements/helpers/CharacterDmNotesHelper.jsx`): the same box markup,
  wrapped in a `<div className="mt-4"><h5>{label}</h5>...</div>` for the "DM Notes" heading.
- `game.description` renders as a bespoke `<p className="mt-3 text-pre-wrap">{game.description}</p>`
  in `GameHelper.jsx` (`static render()`, around the `<h1>{game.name}</h1>` block) — no box at all.
- None of these truncate long content or offer an expand toggle.

Create `frontend/assets/js/components/common/DescriptionBox.jsx` (stateful function component,
following the `ViewAsModal.jsx` pattern for a shared stateful element — see that file for
reference) and `frontend/assets/js/components/common/helpers/DescriptionBoxHelper.jsx`:

- Props: `{ description }`. Returns `null` when `description` is falsy (same guard as
  `CharacterDescriptionHelper`/`CharacterDmNotesHelper` today).
- Renders the existing box markup (`mt-3 p-3 border rounded bg-light text-pre-wrap`) unchanged,
  so the visual style of the box itself doesn't change for any of the three pages.
- Add a max-height + expand/collapse behavior. No prior art exists for this in the codebase
  (checked — the only `Collapse` usages are `Navbar.Collapse` and the enabled/disabled section of
  `ViewAsModalHelper.jsx`, neither is a truncate pattern), so this is new UI:
  - Pick one `MAX_COLLAPSED_HEIGHT` constant in the component (e.g. `128` px, roughly 4-5 lines
    of body text at the current font size — adjust after a visual check).
  - Apply it via **inline style** (`style={{ maxHeight: expanded ? 'none' : MAX_COLLAPSED_HEIGHT }}`)
    rather than a SCSS class, so there is a single source of truth for the value instead of
    duplicating it between JS and `main.scss`.
  - Use a `ref` on the box div plus `useLayoutEffect` (keyed on `description`) to compare
    `ref.current.scrollHeight` against `MAX_COLLAPSED_HEIGHT` and store the result in an
    `isOverflowing` state. `scrollHeight` reflects the full content height regardless of the
    `overflow: hidden` state, so this works whether the box is currently collapsed or expanded —
    no need to re-measure on every toggle.
  - Only render the "Show more"/"Show less" toggle button when `isOverflowing` is true. Clicking
    it flips a local `expanded` boolean (`useState`), no controller class needed — this is trivial
    UI state with no side effects or business logic to separate out.
  - Button labels: `Translator.t('description_box.show_more')` /
    `Translator.t('description_box.show_less')` (see "Shared contracts" above). Suggest
    `btn btn-link btn-sm p-0 mt-1` styling to match the existing understated look of e.g.
    `EditButton`/back-button links elsewhere in the app — adjust to taste during a visual check.
  - `overflow: hidden` and `text-pre-wrap`/`white-space: pre-wrap` must both apply to the box so
    line breaks are still preserved when collapsed (matches the issue's explicit requirement).

### Step 2 — Reuse `DescriptionBox` for `pc`/`npc` descriptions

- `resources/character/pages/elements/helpers/CharacterDescriptionHelper.jsx`: replace the inline
  `<div className="mt-3 p-3 border rounded bg-light text-pre-wrap">` with
  `<DescriptionBox description={description} />` (drop the `mt-3` from the caller if `DescriptionBox`
  owns its own top margin, to avoid doubling it — check whichever component ends up owning the
  margin and remove it from the other side).
- `resources/character/pages/elements/helpers/CharacterDmNotesHelper.jsx`: keep the
  `<div className="mt-4"><h5>{label}</h5>` wrapper (the heading is DM-notes-specific, not part of
  the shared box), but replace its inner box markup with `<DescriptionBox description={privateDescription} />`.
- No change to `CharacterDescription.jsx` / `CharacterDmNotes.jsx` (the thin wrapper components) —
  they already just delegate to their helpers.
- No change to gating: `CharacterDmNotesHelper.render()`'s existing `if (!privateDescription) return null;`
  guard stays as-is, and `private_description` continues to only exist in the fetched character
  object for users who can already see it today
  (`CharacterController.loadFullCharacter`'s `can_edit` check) — this issue does not touch
  permissions.

### Step 3 — Reuse `DescriptionBox` for `game.description`

- `resources/game/pages/helpers/GameHelper.jsx`: replace
  `{game.description && <p className="mt-3 text-pre-wrap">{game.description}</p>}` with
  `<DescriptionBox description={game.description} />`. `DescriptionBox`'s own falsy guard makes
  the `game.description &&` check redundant, so it can be dropped.

### Step 4 — Switch the game New/Edit forms to `TextareaField`

- `resources/game/pages/helpers/GameNewHelper.jsx`: replace the `<FormField id="game-new-description"
  type="text" .../>` block with `<TextareaField id="game-new-description" label={...} value={...}
  onChange={...} errors={...} />` (import from `../../../../common/TextareaField.jsx`, same relative
  path already used by `CharacterDescriptionFieldHelper.jsx`). Keep the same `label`/`value`/
  `onChange`/`errors` props being passed today — only the underlying input element changes.
- `resources/game/pages/helpers/GameEditHelper.jsx`: same swap for `id="game-edit-description"`.
- No controller changes needed — `onDescriptionChange`/`formState.description` plumbing is
  input-shape-agnostic (`event.target.value`), and `TextareaField` already follows the same
  `onChange` contract as `FormField`.
- No change to `pc`/`npc` New/Edit forms — `CharacterDescriptionFieldHelper.jsx` and
  `CharacterDmNotesFieldHelper.jsx` already use `TextareaField`.

## Files to Change

- `frontend/assets/js/components/common/DescriptionBox.jsx` — new shared show-page description
  box component (state: `expanded`, `isOverflowing`).
- `frontend/assets/js/components/common/helpers/DescriptionBoxHelper.jsx` — new render helper for
  the box + toggle button.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterDescriptionHelper.jsx`
  — delegate box rendering to `DescriptionBox`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterDmNotesHelper.jsx`
  — delegate box rendering to `DescriptionBox`, keep the `<h5>` label wrapper.
- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx` — replace the
  bespoke `<p>` with `DescriptionBox`.
- `frontend/assets/js/components/resources/game/pages/helpers/GameNewHelper.jsx` — swap
  `FormField` → `TextareaField` for `description`.
- `frontend/assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx` — swap
  `FormField` → `TextareaField` for `description`.
- `frontend/specs/assets/js/components/common/DescriptionBoxSpec.js` — new spec (rendering: null
  when empty, box markup when present, toggle button only when overflowing, label text, expand/
  collapse click behavior).
- `frontend/specs/assets/js/components/common/helpers/DescriptionBoxHelperSpec.js` — new spec for
  the render helper in isolation.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterDescriptionHelperSpec.js`
  — update assertions to match delegation to `DescriptionBox`.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterDmNotesHelperSpec.js`
  — same.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterDescriptionSpec.js`
  / `CharacterDmNotesSpec.js` — update if they assert on box markup directly.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/basicContentSpec.js`
  — update description assertions (this is where `GameHelper`'s description rendering is
  currently tested, per `support.js` in the same folder).
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameNewHelperSpec.js` — update
  the `id="game-new-description"` assertion (still applies) and add a `textarea`-vs-`input` tag
  assertion if useful.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameEditHelperSpec.js` — same
  for `id="game-edit-description"`.

## CI Checks

- `frontend`: `yarn test` (CI job: `jasmine`)
- `frontend`: `yarn lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the translator
  agent's `description_box` keys land in both `en.yaml` and `pt.yaml`.

## Notes

- `react-bootstrap` is already a dependency (`2.10.10`, per `package.json`) and is imported via
  `react-bootstrap/cjs/<Component>.js` elsewhere (see `ViewAsModalHelper.jsx`) — reuse that import
  style if a `react-bootstrap` component ends up being used for the toggle transition; a plain CSS
  `max-height` transition (no `react-bootstrap` import at all) is equally acceptable and simpler.
- The exact `MAX_COLLAPSED_HEIGHT` pixel value and button styling are a visual-polish judgment
  call — do a local visual check (`make dev-up`, view a game/PC/NPC page with a long description)
  before finalizing.
- Do not add any new permission/visibility logic — the issue explicitly excludes that, and
  `private_description` gating is already correct at fetch time.
