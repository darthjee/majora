# Plan: Refactor backend test setUpTestData methods flagged as too long (Lizard nloc-medium)

Issue: [1166-refactor-backend-test-setuptestdata-methods-flagged-as-too-long--lizard-nloc-medium.md](../../issues/1166-refactor-backend-test-setuptestdata-methods-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

Test-only refactor of 8 `setUpTestData` methods in `backend/uploads/tests/` (7 flagged by Lizard's 50-NLOC limit, plus one opportunistic file) — extracting file-local per-subject fixture helpers and a new shared `UploadFinalizeFixtureMixin` for the actor/upload boilerplate duplicated across files. No production code or behavior changes.

See [backend.md](backend.md) for the full plan.
