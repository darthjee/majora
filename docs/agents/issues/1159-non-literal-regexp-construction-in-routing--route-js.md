# Issue: Non-literal RegExp construction in routing (Route.js)

## Description
Codacy (ESLint `security/detect-non-literal-regexp`, `security-node/non-literal-reg-expr`) flags the `new RegExp(...)` construction in `frontend/assets/js/utils/routing/Route.js` because its pattern argument is not a literal.

## Problem
Tracing every caller of `Route`'s constructor (`Router#register`, `Router.extractParams`, and their callers across page controllers and `accessRouteConfig.js`'s `ROUTE_TEMPLATES`) shows the `path`/`pattern` argument is always a hardcoded, developer-authored route-template string (e.g. `/games/:game_slug/polls/:id`). None of it is ever derived from the runtime URL/hash or any other user-controlled input — the runtime hash is only ever the *subject* matched against the compiled regex (`matches(path)` / `params(path)`), never compiled into the pattern itself. Static segments are also escaped via `Route.#escapeRegex` before being folded into the pattern. So the flagged construction is not exploitable for ReDoS or pattern injection today, but the static analyzer can't see that call-graph guarantee and will keep flagging it.

## Expected Behavior
Codacy no longer reports this finding, while the code stays defended against a future caller accidentally passing runtime/URL-controlled input into `Route`'s constructor.

## Solution
Suppress the finding at the `new RegExp(...)` call in `Route.js` with a scoped inline eslint-disable comment, documenting inline why the input is safe: route patterns are always internal, developer-authored constants, never user/URL-controlled, and static segments are escaped via `#escapeRegex`.

## Benefits
- Clears the Codacy/security finding without adding unnecessary runtime sanitization overhead to a hot routing path.
- Leaves a documented rationale in the code so future readers (and future callers of `Route`) understand the safety invariant that must hold.
