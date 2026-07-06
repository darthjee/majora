# Plan: Refactor components: avoid inline JSX conditionals and oversized markup

Issue: [344-refactor-components--avoid-inline-jsx-conditionals-and-oversized-markup.md](../issues/344-refactor-components--avoid-inline-jsx-conditionals-and-oversized-markup.md)

## Overview

Introduce a reusable `ConditionalComponent` element that renders its children only when a
`render` prop is `true`, document the frontend's inline-JSX-conditional extraction patterns in
`docs/agents/frontend.md`, and apply the new component to the four helper spots flagged in the
issue (`GameHelper`, `CharacterHelper`, `GameCharactersHelper`, `StaffUsersHelper`) so each one
demonstrates the documented convention instead of an ad-hoc `{cond && (...)}` wrap.

## Context

Several `pages/helpers/*.jsx` render helpers wrap a chunk of JSX directly in an inline `&&`
condition (`{game.can_edit && (<EditButton>...)}`). This mixes conditional logic with markup
inline and isn't a documented convention anywhere. The issue asks for:

1. A documented set of extraction patterns (dedicated component / `ConditionalComponent` /
   named helper method / static render helper) added to `docs/agents/frontend.md`.
2. A new `ConditionalComponent` under `components/elements/`, with its own spec.
3. The four listed spots refactored to use pattern #1 or #2 as concrete examples.

All affected files live under `frontend/`, so this plan is single-agent (`frontend`) — no
agent split or shared contracts are needed.

## Implementation Steps

### Step 1 — Add `ConditionalComponent`

Create `frontend/assets/js/components/elements/ConditionalComponent.jsx`, a small functional
component following the same `{ children }`-passthrough shape as `PageActions.jsx`:

```jsx
export default function ConditionalComponent({ render, children }) {
  return render ? children : null;
}
```

Add JSDoc per the project's ESLint rules (prose description, `@param` for `render` and
`children`, `@returns`).

### Step 2 — Spec for `ConditionalComponent`

Create `frontend/specs/assets/js/components/elements/ConditionalComponentSpec.js`, modeled on
`PageActionsSpec.js`: render with `render={true}` and assert the children markup is present;
render with `render={false}` and assert the children markup is absent (empty output).

### Step 3 — Refactor `GameHelper.jsx`

In `frontend/assets/js/components/pages/helpers/GameHelper.jsx`, replace:

```jsx
{game.can_edit && (
  <EditButton href={`#/games/${game.game_slug}/edit`}>
    {Translator.t('character_page.edit')}
  </EditButton>
)}
```

with:

```jsx
<ConditionalComponent render={game.can_edit}>
  <EditButton href={`#/games/${game.game_slug}/edit`}>
    {Translator.t('character_page.edit')}
  </EditButton>
</ConditionalComponent>
```

Import `ConditionalComponent` from `../../elements/ConditionalComponent.jsx`.

### Step 4 — Refactor `CharacterHelper.jsx`

Apply the same substitution to the `{character.can_edit && (<EditButton>...)}` block in
`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, importing
`ConditionalComponent` the same way. Leave the existing private `#buildSecondaryButton` /
`#renderPrivateDescription` helper-method pattern untouched — those already follow pattern #3/#4
and are not part of this issue's flagged spots.

### Step 5 — Refactor `GameCharactersHelper.jsx`

Apply the same substitution to the `{canEdit && (<NewButton>...)}` block in
`frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx`.

### Step 6 — Refactor `StaffUsersHelper.jsx`

Apply the same substitution to the `{recovery.status === 'error' && (<span>...</span>)}` block
inside the private `#renderRecoveryAction` method in
`frontend/assets/js/components/pages/helpers/StaffUsersHelper.jsx`.

### Step 7 — Update existing specs

Check the existing specs for the four helpers above (under
`frontend/specs/assets/js/components/pages/helpers/`) still pass unchanged — the rendered HTML
output is identical before and after the refactor (`ConditionalComponent` renders `null` when
`render` is falsy, exactly like the original `&&` short-circuit), so no spec assertions should
need to change. Run the full suite to confirm.

### Step 8 — Document the patterns

Add a new section to `docs/agents/frontend.md` (after "Component Architecture", before "Pages
vs Elements" — or wherever reads best) documenting the four extraction patterns from the issue:

1. Condition wrapping a large block of HTML → extract a dedicated component.
2. Condition wrapping a non-trivial existing component → use `<ConditionalComponent render={...}>`.
3. Too many chained conditions → extract a named helper/controller method (e.g. `shouldRender()`).
4. Large inline markup without a natural component boundary → extract a `static renderXxx()`
   helper method.

Reference `ConditionalComponent.jsx` and the four refactored helpers as concrete examples.

## Files to Change

- `frontend/assets/js/components/elements/ConditionalComponent.jsx` — new reusable conditional-render component.
- `frontend/specs/assets/js/components/elements/ConditionalComponentSpec.js` — new spec for the component above.
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — replace inline `&&` wrap with `<ConditionalComponent>`.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — replace inline `&&` wrap with `<ConditionalComponent>`.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — replace inline `&&` wrap with `<ConditionalComponent>`.
- `frontend/assets/js/components/pages/helpers/StaffUsersHelper.jsx` — replace inline `&&` wrap with `<ConditionalComponent>`.
- `docs/agents/frontend.md` — document the four extraction patterns.

## CI Checks

- `frontend`: `docker-compose run majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe yarn test` (CI job: `jasmine`, run via `npm run coverage` in CI)
- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`) — unaffected by this change but part of the same job, worth a sanity run.

## Notes

- No backend, infra, proxy, or translator work is required — this is a frontend-only, purely
  presentational refactor with no behavior change.
- `ConditionalComponent` returning `children` directly (not wrapped in a fragment) matches
  React's requirement that a component can return a single node, `null`, or an array/fragment;
  since callers pass a single child element in all four target spots, returning `children`
  as-is is sufficient — no `<>{children}</>` wrapper needed.
- Do not touch `CharacterHelper`'s `#buildSecondaryButton`/`#renderPrivateDescription` or
  `StaffUsersHelper`'s `#renderRowActions`/`#renderRecoveryAction`/`#renderRecoveryLink` — those
  already follow the named-helper-method pattern (#3/#4) and are out of scope.
