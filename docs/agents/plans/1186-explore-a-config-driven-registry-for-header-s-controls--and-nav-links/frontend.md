# Frontend Plan: Explore a config-driven registry for Header's controls (and nav links)

Main plan: [plan.md](plan.md)

## Overview

Replace `HeaderHelper#renderAuthControl`'s and `HeaderNavHelper`'s inline guard-clause gating with a flat registry of `{id, rules, render}` entries (`{id, group, rules, render}` for nav-links), driven by two new collaborators: `CurrentPageContext` (pure `state → derived flags`) and `RuleMatcher` (declarative `all`/`any`/`none`/`exists` rule evaluation, no predicate functions). Structural change only — current rendered output, `data-testid`s, and behavior must stay exactly as they are today.

## Context

`HeaderHelper#renderAuthControl` and `HeaderNavHelper`'s `render*NavLinks` methods currently gate each control/nav item with inline `if (!state.x) return null;` guards spread across separate private methods, making "what appears in the header, and under what condition" hard to trace from one place. Full design rationale, edge cases, backward-compatibility bar, and security review are in the issue file — this plan turns that already-settled design into ordered implementation steps.

## Implementation Steps

### Step 1 — `CurrentPageContext`

Create `frontend/assets/js/utils/context/CurrentPageContext.js`: a pure static `build(state)` function that passes through `state`'s raw fields unchanged and adds derived boolean flags:
- `isGamePage` — `Boolean(state.route?.gameSlug)`
- `isPcPage` — `Boolean(state.route?.page?.startsWith('pcCharacter'))`
- `isNpcPage` — `Boolean(state.route?.page?.startsWith('npcCharacter'))`
- `hasGameAccess` — `Boolean(state.gameAccess?.is_dm || state.gameAccess?.is_player || state.gameAccess?.is_superuser || state.gameAccess?.is_staff)`

No I/O, no imports of `AccessStore` or any client — inputs only. This is new shared infrastructure (no other current consumer), so keep it fully generic/header-agnostic in naming and behavior even though `HeaderHelper`/`HeaderNavHelper` are its only callers today.

Add `frontend/specs/assets/js/utils/context/CurrentPageContextSpec.js`: raw-field passthrough; each derived flag true/false across its inputs, including the "no `route`"/"no `gameAccess`" absent cases.

### Step 2 — `RuleMatcher`

Create `frontend/assets/js/utils/rules/RuleMatcher.js`: a generic, header-agnostic static `matches(rules, context)`, evaluating:
- `all` — every named field truthy (AND)
- `any` — at least one named field truthy (OR)
- `none` — every named field falsy
- `exists` — every named field non-null (needed for `testEmailStatus`, a string, not a boolean)

Guard rails (both via `MajoraLogger.warn`, not `error`, and with no environment-detection code — rely on `MajoraLogger`'s existing `VITE_FRONTEND_LOG_LEVEL` default):
- A rule referencing a field name absent from `context` (`CurrentPageContext.build` always produces a defined value for every real field, so genuine absence reliably signals a typo).
- A missing/empty `rules` object on an entry — treated as suspicious (warn), not as "matches everything."

No `custom: (context) => boolean` escape hatch — strict declarative vocabulary only for now.

Add `frontend/specs/assets/js/utils/rules/RuleMatcherSpec.js`: `all`/`any`/`none`/`exists` individually and combined; the `MajoraLogger.warn` spy-based assertions for both guard cases above.

### Step 3 — Convert `HeaderHelper`'s auth-control section to a registry

Replace `#renderAuthControl` (and its `#renderSendTestEmailButton`/`#renderViewAsLink`/`#renderTestEmailStatus` helpers) with an exported flat array of `{id, rules, render}` entries, reusing shared rule fragments (e.g. `const LOGGED_IN = { all: ['loggedIn'] };`) to avoid repeating `state.loggedIn &&` per entry:

- `login` — `{ none: ['loggedIn'] }`
- `register` — `{ none: ['loggedIn'] }`
- `logoff` — `LOGGED_IN`
- `send-test-email` — `{ all: ['loggedIn'], any: ['isSuperUser', 'isStaff'] }`
- `test-email-status` — `{ all: ['loggedIn'], exists: ['testEmailStatus'] }`
- `my-account-dropdown` — `LOGGED_IN`
- `view-as-link` — `{ all: ['loggedIn', 'canViewAs'] }`

Each `render(context, handlers)` is the existing method body, moved as-is (same JSX, same `data-testid`s, same props) — do not "clean up" markup while moving it. `#renderAuthControl` collapses to: `CurrentPageContext.build(state)` once, then `registry.filter((entry) => RuleMatcher.matches(entry.rules, context)).map((entry) => <React.Fragment key={entry.id}>{entry.render(context, handlers)}</React.Fragment>)`. Declare entries in the exact order the current JSX returns them, so default array order preserves current visual order. Export the registry array (even though nothing outside the module needs it) so specs can assert `id` uniqueness directly.

### Step 4 — Convert `HeaderNavHelper`'s dropdowns to a registry

Replace `renderMiniaturesNavLinks`/`renderAdminNavLinks`/`renderGameNavLinks`/`#renderGameAccessNavItems`/`renderCharacterNavLinks` with an exported flat array of `{id, group, rules, render}` entries:

- Miniatures items → `group: 'miniatures'`, gated `{ all: ['loggedIn'] }`
- Admin items → `group: 'admin'`, gated `{ any: ['isSuperUser', 'isStaff'] }`
- Game dropdown's base items (show/pcs/npcs/treasures/items/possessions/factions/documents/photos) → `group: 'game'`, gated `{ all: ['isGamePage'] }`
- Game dropdown's Players/Polls/Sessions items → `group: 'game'`, gated `{ all: ['isGamePage', 'hasGameAccess'] }` (no structural nesting needed — flat entries in the same group, a stricter rule)
- PC dropdown → `group: 'pc'`, gated `{ all: ['isPcPage'] }` (its own entry/entries, not a method branching on `isPc`/`isNpc`)
- NPC dropdown → `group: 'npc'`, gated `{ all: ['isNpcPage'] }`

Extract the "bucket entries by `group`, render each `NavDropdown` wrapper only when its group has ≥1 surviving entry" logic into its own small, separately-testable function (e.g. `renderGroup(groupId, title, dropdownId, entries, context, handlers)` or similar) — required specifically so the 0-survivors → `null` branch can be unit-tested with synthetic data, since no real current entry set can produce an empty group. Group *render order* (Miniatures, Admin, Game, PC, NPC — matching today's `HeaderHelper.render` call order) is driven by an explicit ordered list of group ids, not inferred from entries' positions in the flat array. Export the registry array for the same id-uniqueness-testing reason as Step 3.

### Step 5 — Wire `HeaderHelper.render` and `HeaderNavHelper` entry points together

`HeaderHelper.render` keeps its unconditional markup (the `#/games` link, brand, `LanguageSelector`, `ResilienceIndicator`, the modals) as plain JSX, outside any registry — do not force-fit it with an always-true rule. It calls the auth-control registry rendering (Step 3) and `HeaderNavHelper`'s grouped nav-link rendering (Step 4) the same way it calls today's methods, just through the new collapsed implementations.

### Step 6 — Tests

New:
- `CurrentPageContextSpec.js`, `RuleMatcherSpec.js` (Steps 1–2).
- A spec asserting both registries' `id`s are unique (e.g. `new Set(registry.map((e) => e.id)).size === registry.length`).
- A spec validating the *real* registries: run `CurrentPageContext.build` for a representative state, collect its keys, and assert every field name referenced anywhere in both registries' `rules` objects is among them (closes the gap `RuleMatcherSpec`'s synthetic-rules coverage leaves — see the issue's security-review notes).
- A unit test for the group-bucketing/render-group function from Step 4, using a synthetic/fake entry set, covering the 0-survivors → `null` case that no real data can trigger.
- Order-sensitive assertions added to `authControlsSpec.js` (e.g. Logoff renders before the my-account dropdown) and to the existing nav-link specs (dropdown order matches the declared group order) — `toContain`-style assertions don't check relative order today.

Existing specs (`HeaderHelper/authControlsSpec.js`, `testEmailSpec.js`, `viewAsLinkSpec.js`, `myAccountAndLanguageSpec.js`, `gameNavLinksSpec.js`, `miniaturesNavLinksSpec.js`, `navLinksSpec.js`, `characterNavLinksSpec.js`, `resilienceIndicatorSpec.js` — note all of these currently live under `HeaderHelper/`, including the nav-link ones, since they exercise nav-link rendering through `HeaderHelper.render`'s composed output) must pass **unmodified**. If any existing assertion needs to change to pass, that's a signal the refactor drifted from structural-only — stop and reconsider before proceeding.

As an implementation-time (not committed) verification aid: capture `HeaderHelper.render`'s output for a handful of representative state combinations before touching the code, diff against the same states after.

## Files to Change

- `frontend/assets/js/utils/context/CurrentPageContext.js` — new.
- `frontend/specs/assets/js/utils/context/CurrentPageContextSpec.js` — new.
- `frontend/assets/js/utils/rules/RuleMatcher.js` — new.
- `frontend/specs/assets/js/utils/rules/RuleMatcherSpec.js` — new.
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — `#renderAuthControl` and its private helpers replaced by an exported registry + collapsed render loop.
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — `render*NavLinks`/`#renderGameAccessNavItems` replaced by an exported registry + grouped render loop.
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/authControlsSpec.js`, `gameNavLinksSpec.js`, `miniaturesNavLinksSpec.js`, `navLinksSpec.js`, `characterNavLinksSpec.js` — extended with order-sensitive assertions (existing assertions unchanged).
- New spec file(s) for registry id-uniqueness, real-registry field-name validation, and the group-bucketing/render-group unit test — exact file(s)/location left to the implementer's judgment, consistent with this codebase's existing per-concern spec-file convention under `HeaderHelper/`.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run via `docker-compose run --rm majora_fe yarn lint` / the project's test container, per this repo's convention of always running frontend commands through Docker Compose rather than directly on the host.

## Notes

- #1182 (mechanical Lizard fix for the same method) proceeds independently and is not a dependency of this plan; whether it's still needed once this lands is validated afterward, not decided upfront.
- #1188 (consolidate Header's data-fetching into one endpoint) is an independent, non-blocking follow-up issue — out of scope for this plan. `CurrentPageContext.build(state)` only cares about the shape of `state` it's handed, so it's unaffected either way.
- Security-reviewed during `/discuss-issue`: no blocking findings. This plan already incorporates its two recommendations (the field-name-validation test in Step 6, and the acceptance criterion that every registry-reachable handler stays independently authorized server-side — no new work needed for that criterion since the handlers are passed through unchanged, just verify it holds during review).
- `none`-shaped rules have a fail-*open* typo failure mode (a misspelled field reads falsy, which satisfies "all falsy") — no current entry needs `none` for a privilege-sensitive gate, but keep this in mind if one is ever added later.
