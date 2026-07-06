# Refactor components: avoid inline JSX conditionals and oversized markup

## Context

Some frontend render helpers embed large blocks of JSX directly inside inline conditionals, or chain multiple boolean checks directly in the JSX itself, instead of delegating to a dedicated component or a named helper method. This makes render logic harder to read, test, and reuse:

- Wrapping a large block of markup directly in an inline condition (`{canEdit && (<table>...</table>)}`) mixes the conditional logic with a big chunk of markup, making both harder to scan.
- Chaining several boolean conditions directly in JSX (`{canEdit && isLogged && isCorrect && (<SomeComponent />)}`) obscures the actual rendering intent behind a wall of logic.
- Large standalone markup blocks (e.g. a hand-written `<table>`) that don't warrant a full component are still sometimes written inline rather than extracted to a helper method.

A codebase scan found no severe violations today, but several mild single-condition wraps already exist and can serve as the first refactor targets:

- `pages/helpers/GameHelper.jsx` (`{game.can_edit && (<EditButton>...)}`)
- `pages/helpers/CharacterHelper.jsx` (`{character.can_edit && (<EditButton>...)}`)
- `pages/helpers/GameCharactersHelper.jsx` (`{canEdit && (<NewButton>...)}`)
- `pages/helpers/StaffUsersHelper.jsx` (`{recovery.status === 'error' && (<span>...</span>)}`)

## What needs to be done

Adopt the following extraction patterns going forward, and use them to refactor the four spots listed above:

1. **Condition wrapping a large block of HTML** — extract a dedicated component that receives the relevant attributes, so the call site becomes `{canEdit && <EditableSomething ... />}`.
2. **Condition wrapping a non-trivial existing component** — build a reusable `ConditionalComponent` under `components/elements/` that takes a `render` boolean prop and renders its children when true, so the call site becomes `<ConditionalComponent render={canEdit}>...</ConditionalComponent>`. This is a real component to add (with its own spec), not just a documented pattern.
3. **Too many chained conditions** — extract the boolean expression into a named helper/controller method (e.g. `shouldRender()`) so the JSX reads `{shouldRender() && <SomeComponent />}`.
4. **Large inline markup without a natural component boundary** — extract a static helper method (following the existing `static renderXxx()` convention in `helpers/*.jsx`) instead of writing the markup inline.

Document these patterns in `docs/agents/frontend.md` alongside the existing Component/Controller/Helper architecture, then apply pattern #1 or #2 to refactor the four listed spots as concrete examples.

## Acceptance criteria

- [ ] A `ConditionalComponent` exists under `components/elements/` (with its own spec) that renders its children when a `render` prop is `true`.
- [ ] `pages/helpers/GameHelper.jsx`, `pages/helpers/CharacterHelper.jsx`, `pages/helpers/GameCharactersHelper.jsx`, and `pages/helpers/StaffUsersHelper.jsx` no longer wrap large markup blocks directly in inline JSX conditionals.
- [ ] `docs/agents/frontend.md` documents the extraction patterns (dedicated component, `ConditionalComponent`, named helper method, static render helper) alongside the existing Component/Controller/Helper architecture.
- [ ] Existing and new frontend specs pass.
