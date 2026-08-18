# Frontend Plan: Non-literal RegExp construction in routing (Route.js)

Main plan: [plan.md](plan.md)

## Overview
`frontend/assets/js/utils/routing/Route.js` builds a `RegExp` from a string that isn't a literal, which Codacy flags via ESLint's `security/detect-non-literal-regexp` and `security-node/non-literal-reg-expr` rules. Tracing every call path into `Route`'s constructor (`Router#register`, `Router.extractParams`, and every page controller / `accessRouteConfig.js`'s `ROUTE_TEMPLATES` that calls them) confirms the `path`/`pattern` argument is always a hardcoded, developer-authored route-template string (e.g. `/games/:game_slug/polls/:id`) — never derived from the runtime URL/hash or any other user input. The runtime hash is only ever the *subject* matched against the compiled regex (`matches(path)` / `params(path)`), never compiled into the pattern itself, and static segments are already escaped via `Route.#escapeRegex`. The fix is a scoped, documented suppression — no runtime behavior change.

## Implementation Steps

### Step 1 — Add a documented inline suppression in `Route.js`
In `frontend/assets/js/utils/routing/Route.js`, on the `new RegExp(...)` line inside the constructor, add an inline eslint-disable comment covering both flagged rules, following this repo's existing convention (see `frontend/assets/js/utils/logging/MajoraLogger.js:67` and `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js:89` for the `// eslint-disable-next-line <rule> -- <reason>` style):

```js
// eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr --
// `pattern` is always built from a hardcoded, developer-authored route template
// (see Router#register / Router.extractParams and their callers) — never from
// runtime URL/hash or other user input. Static segments are pre-escaped via
// #escapeRegex.
this.#regex = new RegExp(`^${pattern}/?$`);
```

Confirm both rule names are exactly what Codacy/ESLint report locally (`npm run lint`) before finalizing the comment — adjust the disabled rule id(s) if the local lint output names them differently.

### Step 2 — Verify no other call site regresses the safety invariant
Re-confirm (already done during planning, worth a final check before/after the change) that every caller of `new Route(...)` still passes only a hardcoded pattern string — `Router#register` (frontend/assets/js/utils/routing/Router.js:19), `Router.extractParams` (frontend/assets/js/utils/routing/Router.js:42), and their callers across `frontend/assets/js/components/**/controllers/*.js` and `frontend/assets/js/utils/access/accessRouteConfig.js`'s `ROUTE_TEMPLATES`. No code changes expected here — this step is a verification, not an implementation step.

## Files to Change
- `frontend/assets/js/utils/routing/Route.js` — add the documented inline eslint-disable comment on the `new RegExp(...)` line in the constructor.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No behavior change and no new tests are needed — this is a lint-suppression-only fix scoped to the single flagged line, per the issue's confirmed scope.
- If ESLint's inline-comment syntax rejects a comma-separated rule list with a trailing `--` reason on the same directive, split into two consecutive `eslint-disable-next-line` comments (one per rule) instead, keeping the reason on the last one.
