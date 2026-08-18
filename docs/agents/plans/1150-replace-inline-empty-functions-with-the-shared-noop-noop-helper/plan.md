# Plan: Replace inline empty functions with the shared Noop.noop helper

Issue: [1150-replace-inline-empty-functions-with-the-shared-noop-noop-helper.md](../../issues/1150-replace-inline-empty-functions-with-the-shared-noop-noop-helper.md)

## Overview
Replace all 53 Codacy-flagged inline empty functions (46 files, all under `frontend/`) with the shared `frontend/assets/js/utils/Noop.js` helper, using two mechanical substitution patterns depending on call-site shape. Purely a frontend concern.

See [frontend.md](frontend.md) for the full plan.
