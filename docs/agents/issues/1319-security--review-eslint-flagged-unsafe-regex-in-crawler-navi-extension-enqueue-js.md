# Issue: Security: review ESLint-flagged unsafe regex in crawler navi-extension enqueue.js

## Description
Codacy SRM (SCA/DoS) flagged ESLint's `security/detect-unsafe-regex` rule on `BUNDLE_URL_PATTERN` in `crawler/navi-extension/src/backend/enqueue.js:7`:

```js
const BUNDLE_URL_PATTERN = /^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$/i;
```

This pattern matches against the `url` field of the `POST /ext/lootstudios/enqueue.json` request body — untrusted input fetched from the network side of the crawler extension — so it needs a human security pass rather than being dismissed outright.

## Problem
ESLint's safe-regex heuristic cannot statically prove this pattern is free of catastrophic backtracking, so it flags it conservatively. Structurally, though, the pattern has no nested/overlapping unbounded quantifiers: `([a-z0-9-]+)` is a single bounded capture group, the character class excludes `/`, and the following `(\?.*)?` only ever starts matching at a literal `?` that cannot itself be produced by the preceding group — so there is no ambiguity for the backtracking engine to explore. This reads as a likely false positive, but it has not been formally confirmed or documented, so Codacy will keep re-flagging it on every scan.

## Expected Behavior
The regex's safety against pathological input (e.g. a very long slug or an unusually long query string) is explicitly confirmed, and the finding is resolved in a way that documents that reasoning in the code itself — either as an inline suppression with justification, or via a rewrite that removes the ambiguity the heuristic reacts to — so the Codacy finding does not keep resurfacing.

## Solution
Confirm `BUNDLE_URL_PATTERN` runs in linear time regardless of input length/shape (analytically and/or with a quick benchmark against a long slug and long query string), then add a scoped `// eslint-disable-next-line security/detect-unsafe-regex` comment directly above the pattern with a one-line justification (bounded capture group, no overlapping unbounded quantifiers, hence no catastrophic backtracking). Owned by the `crawler` agent, since the file lives under `crawler/navi-extension/`.

## Benefits
Resolves the Codacy SRM finding without weakening the existing URL validation logic, and leaves an auditable record of the false-positive reasoning for future readers and future scans.
