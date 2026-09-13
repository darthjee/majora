# Plan: Security: review ESLint-flagged unsafe regex in crawler navi-extension enqueue.js

Issue: [1319-security--review-eslint-flagged-unsafe-regex-in-crawler-navi-extension-enqueue-js.md](../../issues/1319-security--review-eslint-flagged-unsafe-regex-in-crawler-navi-extension-enqueue-js.md)

## Overview
Resolve the Codacy/ESLint `security/detect-unsafe-regex` finding on `BUNDLE_URL_PATTERN` in `crawler/navi-extension/src/backend/enqueue.js` by confirming the pattern is linear-time (no catastrophic backtracking) and documenting that with a scoped inline suppression, per the user's confirmed fix approach — no behavior change to the working validation logic.

See [crawler.md](crawler.md) for the full plan.
