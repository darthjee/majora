# Refactor: handle unhandled async errors in frontend/specs/support/flushMicrotasks.js

## Context

Codacy's ESLint security-node scan (`detect-unhandled-async-errors`, Security, High severity) flags `frontend/specs/support/flushMicrotasks.js:9` for an asynchronous function whose errors aren't handled. An unhandled rejection here can surface as a confusing failure elsewhere in the test suite, or mask a real bug in the code under test.

## What needs to be done

Frontend: inspect the async function at `frontend/specs/support/flushMicrotasks.js:9` and add proper error handling (try/catch, `.catch()`, or an explicit rejection handler) so rejections are handled deterministically instead of becoming unhandled promise rejections.

## Acceptance criteria

- [ ] The async function at flushMicrotasks.js:9 handles its own errors/rejections explicitly
- [ ] The frontend spec suite (`yarn test`) still passes
- [ ] Codacy's ESLint `detect-unhandled-async-errors` finding clears for this file
