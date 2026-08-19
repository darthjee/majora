# Issue: Explore a config-driven registry for Header's controls (and nav links)

## Description

Spun off from #1167 while enhancing #1182 (Header/Account Lizard nloc-medium fix). Explores replacing `HeaderHelper#renderAuthControl`'s (and `HeaderNavHelper`'s) inline guard-clause gating with a declarative, config-driven approach — not a direct port of the existing `listTypeConfig.js` pattern (that's a *keyed-lookup* object, consumed by explicit key), but a *filtered registry*, settled during the `/enhance-issue` pass into three small, single-responsibility collaborators (see Solution).

## Problem

`HeaderHelper#renderAuthControl` and `HeaderNavHelper`'s `render*NavLinks` methods currently gate each control/nav item with an inline `if (!state.x) return null;` guard clause, spread across separate methods. This works, but "what appears in the header, and under what condition" isn't visible from one place — it has to be traced through several methods.

## Expected Behavior

- A registry-driven Header auth-control section (`HeaderHelper`): each entry declares its own `rules` (data, not a predicate function) and its own `render(context, handlers)`. `#renderAuthControl` collapses to building the context once, then filtering + mapping the registry.
- The same registry shape applies to `HeaderNavHelper`'s nav dropdowns (Miniatures/Admin/Game/PC/NPC) — **in scope, not an optional stretch goal**: the shared `CurrentPageContext` flags (`isGamePage`, `isPcPage`, `isNpcPage`, `hasGameAccess`) exist specifically to serve `HeaderNavHelper`'s own conditions, so leaving it unconverted would ship those flags with no consumer for their original motivating case and leave the two sibling helpers on inconsistent patterns.
- Preserves current behavior exactly — this is a structural change, not a UI/behavior change. See "Backward compatibility" below for the precise acceptance bar.
- Every `handlers.onXClick` reachable through a registry entry (e.g. `onSendTestEmailClick`, `onViewAsClick`) still triggers a request that is independently authorized server-side — confirmed by security review (see Solution). A render-side bug (wrong entry showing) can at most surface a UI affordance a user can't act on, never grant them an actual capability; this is presumably already true today (these handlers are unchanged), but is now an explicit acceptance criterion for the refactor rather than an implicit assumption.

## Solution

Three small, single-responsibility collaborators:

- **`CurrentPageContext`** (`frontend/assets/js/utils/context/CurrentPageContext.js`) — a pure function, `build(state)`, turning the header's already-resolved state (`route`, `gameAccess`, `loggedIn`, etc.) into a flat context object: passes raw fields through and adds derived boolean flags (`isGamePage`, `isPcPage`, `isNpcPage`, `hasGameAccess`, …) that today are computed ad hoc inline (e.g. `HeaderNavHelper`'s `page?.startsWith('pcCharacter')`, `#renderGameAccessNavItems`'s `is_dm || is_player || …` check). Deliberately has **no I/O** — it never calls `AccessStore` or fetches anything itself, only derives from inputs it's given, which keeps it dependency-free and reusable outside the header later (no other consumer exists yet, so this is new shared infrastructure, not an extraction of something already shared).
- **`RuleMatcher`** (`frontend/assets/js/utils/rules/RuleMatcher.js`) — generic, header-agnostic `matches(rules, context)`, evaluating a small declarative vocabulary against a `CurrentPageContext`-shaped object: `all` (every named field truthy — AND), `any` (at least one named field truthy — OR), `none` (every named field falsy), `exists` (every named field non-null — needed for `testEmailStatus`, which is a string, not a boolean). Replaces per-entry predicate *functions* with reusable rule *data* — e.g. a shared `LOGGED_IN = { all: ['loggedIn'] }` fragment gets referenced by every logged-in-gated entry instead of each repeating `state.loggedIn &&` in its own closure. Stays strict/declarative-only — no `custom: (context) => boolean` escape hatch; add one only if a genuine future gap appears, rather than pre-building it (every current condition, audited, fits `all`/`any`/`none`/`exists`).
- **Registries + rendering** stay in the existing helper files (`HeaderHelper.jsx` for auth-control, `HeaderNavHelper.jsx` for nav-links) — each becomes a flat array of `{id, rules, render}` entries (`{id, group, rules, render}` for nav-links, where `group` tags which dropdown an entry belongs to). Render methods collapse to: build the context once, then `.filter(entry => RuleMatcher.matches(entry.rules, context)).map(entry => entry.render(context, handlers))`.

Flat, not nested: with `hasGameAccess` precomputed onto the context, the Game dropdown's inner Players/Polls/Sessions gate does not need structural nesting — it is just another flat entry tagged `group: 'game'` with a stricter rule (`{all: ['isGamePage', 'hasGameAccess']}` vs. the group's other entries' `{all: ['isGamePage']}`). Dropdown grouping is handled by bucketing flat entries by `group` at render time. The PC/NPC dropdown actually simplifies under this split too — two registry entries (`{id: 'pc', rules: {all: ['isPcPage']}}` / `{id: 'npc', rules: {all: ['isNpcPage']}}`) instead of one method branching internally on `isPc`/`isNpc`.

### Edge cases

New mechanics this refactor itself introduces (none exist in today's hand-written JSX, since `.map()` is new):

- **React `key` prop**: `.map()`-produced siblings need one; inject centrally at the `.map()` call site (e.g. `<React.Fragment key={entry.id}>{entry.render(context, handlers)}</React.Fragment>`) rather than requiring each `render()` to remember it.
- **Empty dropdown groups**: bucketing nav-link entries by `group` and rendering each `NavDropdown` wrapper only when its group has survivors is new logic. No current group can actually end up empty, but the group-rendering code must still explicitly handle 0-survivors → render `null`.
- **Scope boundary**: `HeaderHelper.render`'s unconditional markup (the `#/games` link, brand, `LanguageSelector`, `ResilienceIndicator`, the modals) stays outside the registry as plain JSX — not force-fit with an always-true rule.
- **Duplicate `id`s**: since `id` doubles as the React `key`, a copy-paste duplicate would not error at definition time — cover it with a test asserting registry ids are unique.
- **Nav-link group render order** (Miniatures/Admin/Game/PC/NPC) needs its own explicit ordered list of group ids driving dropdown order — it cannot be inferred from entries' positions in the flat, possibly-interleaved registry array.
- **Silent typos in rule field names**: a misspelled context field (e.g. `'canViewAsX'`) does not error — `RuleMatcher` just reads `undefined`, treats it as falsy, and the entry silently stops rendering for everyone, permanently, with no signal. Guarded via `RuleMatcher` calling `MajoraLogger.warn(...)` when a rule references a field absent from the built context (`CurrentPageContext.build` always produces a defined value for every real field, so genuine absence reliably signals a typo, not a legitimate falsy state). Deliberately `warn`, not `error`, and with **no new environment-detection code** — `MajoraLogger`'s existing `VITE_FRONTEND_LOG_LEVEL` threshold already defaults to `'error'` everywhere (confirmed unset throughout this repo), so `warn` calls are silent by default; if this class of bug is ever suspected in production, it can be surfaced after the fact by redeploying with `VITE_FRONTEND_LOG_LEVEL=warn` — no code change needed. See Testing below for the CI-enforced complement to this runtime-only guard.
- **`none` has a fail-*open* typo failure mode, unlike `all`/`any`** (per security review): every current gate is "show if true" (`all`/`any`-shaped), where a typo can only ever suppress rendering (fail-closed). Under `none` ("hide if true"), a typo'd field name reads `undefined` → falsy → still satisfies "all named fields falsy" → the entry renders anyway — the opposite, more dangerous direction. No current entry needs `none` for a privilege-sensitive gate, so this isn't an active defect, but a future `none`-shaped, privilege-sensitive entry should get the field-name-validation test from Testing below before it ships, specifically because of this fail-open direction.

### Backward compatibility

Existing specs (`HeaderHelper/authControlsSpec.js`, `testEmailSpec.js`, `viewAsLinkSpec.js`, `myAccountAndLanguageSpec.js`, `gameNavLinksSpec.js`, `miniaturesNavLinksSpec.js`, `navLinksSpec.js`, `characterNavLinksSpec.js`, `resilienceIndicatorSpec.js`, and their `HeaderNavHelper` counterparts) render to an HTML string and assert via `toContain`/`not.toContain` on `data-testid`/text/`href` — not a full DOM/snapshot comparison. That sets the acceptance bar precisely: **every existing assertion in these files passes unmodified** after the refactor; new specs are additive (`RuleMatcher`, `CurrentPageContext`, the empty-group/duplicate-id/unknown-field-warning mechanics above). If an existing assertion needs to change to pass, that is a signal the refactor drifted from structural-only.

Two gaps `toContain`-style assertions leave open, addressed explicitly:

- **Relative order is not checked today** (`toContain` does not care which substring comes first), even though visual order matters and the flat-registry conversion could accidentally reorder entries. New order-sensitive assertions are added where position matters.
- **Implementation-time verification**: capture `HeaderHelper.render`/`HeaderNavHelper` output for a handful of representative state combinations before touching the code, diff against the same states after — a throwaway before/after check during implementation, not a permanent committed snapshot test.

`key` props are invisible to these string-based assertions — React's `key` is never serialized into rendered HTML, so that change carries no risk to any existing spec.

### Testing

New spec files:

- `frontend/specs/assets/js/utils/context/CurrentPageContextSpec.js` — `CurrentPageContext.build`: raw fields pass through unchanged; `isGamePage`/`isPcPage`/`isNpcPage` derived correctly (including the "no route at all" case); `hasGameAccess` true/false across `gameAccess`'s `is_dm`/`is_player`/`is_superuser`/`is_staff` combinations, including `gameAccess` itself being absent.
- `frontend/specs/assets/js/utils/rules/RuleMatcherSpec.js` — `all`/`any`/`none`/`exists` individually and combined, plus the `MajoraLogger.warn` call when a rule references a field absent from context (spy-based). A missing/empty `rules` object is treated as suspicious, not as "matches everything": it triggers the same `MajoraLogger.warn` guard as an unknown field, rather than silently making an entry render unconditionally — consistent with the Edge Cases section's "fail loud via `warn`, never fail silent" principle for authoring mistakes.

Existing specs are extended, not replaced: order-sensitive assertions are added to `authControlsSpec.js` (e.g. Logoff renders before the my-account dropdown) and to the nav-link specs (dropdown order matches the declared group order), closing the gap plain `toContain` assertions leave open (see Backward compatibility above).

Two concrete design requirements fall out of making this testable:

- The "bucket nav-link entries by `group`, render the `NavDropdown` wrapper only if it has survivors" logic is extracted into its own small function, testable in isolation with a synthetic/fake registry — no real current state can ever produce an empty group (every group has at least one ungated base item), so that guard is otherwise unverifiable dead code from the test suite's point of view.
- Both registries (`HeaderHelper`'s auth-control array, `HeaderNavHelper`'s nav-link array) are exported from their modules, even though nothing outside currently needs them, specifically so a spec can assert `id` uniqueness directly rather than only reaching them indirectly through `render()`'s output.
- Per security review: `RuleMatcherSpec`'s field-name-typo coverage only exercises synthetic rules, not the real registries, and `RuleMatcher`'s `MajoraLogger.warn` guard is silent by default in production (confirmed against `MajoraLogger`'s actual `'error'` default level) — so it's a runtime diagnostic, not a pre-merge guarantee. A dedicated test closes that gap: run `CurrentPageContext.build` for a representative state, collect its keys, and assert every field name referenced anywhere in both *real* registries' `rules` objects is among them — turning "fail loud via `warn`" into a CI-enforced guarantee rather than an opt-in runtime signal.

### Open questions

- Resolved during `/enhance-issue`: whether this fully replaces #1182's simpler private-method-extraction fix. No upfront decision — #1182 proceeds independently, and whether it is still needed gets validated after this issue's refactor lands.
- Permissions: these are client-side render-visibility gates, not data-fetch endpoint-variant selection, so `RequestPermissionResolvers`/`AccessStore` guidance does not directly apply — sanity-checked, nothing in the registry stands in for a real permission check. `CurrentPageContext`'s inputs (`isSuperUser`/`isStaff`/`gameAccess`) may end up sourced differently once #1188 lands, but `CurrentPageContext.build(state)` only cares about the shape of `state` it is handed, so it is unaffected either way.
- Resolved during `/discuss-issue`: performance is negligible (context built once per render, `.filter().map()` over a small, bounded registry, no new I/O). Security-reviewed (see Solution/Testing/Edge cases above) — no blocking findings; the review's two recommendations (the explicit acceptance criterion in Expected Behavior, and the real-registry field-name-validation test in Testing) are already folded in.

### Related issues

- #1188 — Consolidate Header's data-fetching into a single dedicated endpoint. Spun off while enhancing this issue; independent/non-blocking — a backend data-fetching change, distinct from this issue's frontend rendering-structure scope.

### Relation to #1182

#1182 (mechanical Lizard fix for Header/Account) proceeds independently using straightforward method extraction; this issue is a follow-up architecture exploration, not a blocker. Whether it is still needed once this refactor lands is validated afterward, not decided upfront.

## Benefits

- Makes "what's in the header and why" declarative and easier to extend as new sections are added over time.
- `CurrentPageContext`/`RuleMatcher` are reusable, dependency-free infrastructure beyond the header.
