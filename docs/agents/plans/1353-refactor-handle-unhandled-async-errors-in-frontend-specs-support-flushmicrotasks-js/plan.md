# Plan: Refactor: handle unhandled async errors in frontend/specs/support/flushMicrotasks.js

Issue: [1353-refactor-handle-unhandled-async-errors-in-frontend-specs-support-flushmicrotasks-js.md](../../issues/1353-refactor-handle-unhandled-async-errors-in-frontend-specs-support-flushmicrotasks-js.md)

## Overview
Rewrite the `flushMicrotasks` spec helper as a non-`async` function so Codacy's `detect-unhandled-async-errors` finding clears, and drop the now-unneeded ESLint override that existed only to keep a misplaced suppression comment alive.

See [frontend.md](frontend.md) for the full plan.
