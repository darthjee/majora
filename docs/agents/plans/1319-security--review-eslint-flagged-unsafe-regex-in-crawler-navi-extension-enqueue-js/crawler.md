# Crawler Plan: Security: review ESLint-flagged unsafe regex in crawler navi-extension enqueue.js

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Confirm the regex is linear-time
Analyze `BUNDLE_URL_PATTERN` in `crawler/navi-extension/src/backend/enqueue.js:7`:

```js
const BUNDLE_URL_PATTERN = /^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$/i;
```

Confirm there is no ambiguous/overlapping unbounded quantifier pair for the backtracking engine to explore: `([a-z0-9-]+)` is a single bounded capture group whose character class excludes `/`, and `(\?.*)?` can only start matching once a literal `?` is reached — a character `[a-z0-9-]+` cannot itself consume. Sanity-check with a quick local run (e.g. `node -e`) against pathological input: a very long slug (e.g. 50k `a` characters with no trailing `/` or `?`) and a very long query string, verifying the match/no-match resolves in effectively constant time rather than scaling exponentially. This step produces the justification text used in Step 2 — no code changes here.

### Step 2 — Add a scoped, justified suppression
Add a `// eslint-disable-next-line security/detect-unsafe-regex` comment directly above the `BUNDLE_URL_PATTERN` declaration, with a one-line justification restating Step 1's reasoning (bounded capture group, no overlapping unbounded quantifiers, hence no catastrophic backtracking). Keep the suppression scoped to this single line only — do not disable the rule file-wide or add a blanket ignore.

## Files to Change
- `crawler/navi-extension/src/backend/enqueue.js` — add the scoped `eslint-disable-next-line security/detect-unsafe-regex` comment with justification above `BUNDLE_URL_PATTERN` (line 7); no other logic changes.

## CI Checks
- `crawler/navi-extension`: `docker compose run --rm extension_tests lint` (CI job: `crawler_extension_tests`, step "Check JS Lint") — confirms the suppression comment silences the ESLint finding and no other lint rule is broken.
- `crawler/navi-extension`: `docker compose run --rm extension_tests` (CI job: `crawler_extension_tests`, step "Tests") — existing `tests/backend/enqueue_spec.js` coverage must keep passing since matching behavior is unchanged.

## Notes
- No behavior change: the regex itself is not rewritten, only annotated. `tests/backend/enqueue_spec.js` should need no new assertions unless the reviewer wants an explicit pathological-input regression test — optional, not required by the issue.
- This is a single-file, single-line change; no other agent's scope is touched.
