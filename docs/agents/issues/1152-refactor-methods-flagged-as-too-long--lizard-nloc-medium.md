# Issue: Refactor methods flagged as too long (Lizard nloc-medium)

## Description

Codacy's `Lizard` complexity analyzer flags 33 methods across 32 files as exceeding the configured lines-of-code-per-method threshold (mostly 50 NLOC, some higher for specific languages/contexts). The occurrences span all three code domains: `backend/` (Django test `setUpTestData` methods), `frontend/` (React components, helper render methods, and Jasmine specs), and `proxy/` (one PHP test method). Long methods are harder to review, test, and reason about in isolation.

## Problem

`docs/agents/contributing.md`'s Definition of Done already requires classes/methods to have focused responsibilities, but explicitly exempts specs/tests from that requirement unless there is excessive duplication ("This requirement applies primarily to source code. For specs/tests, refactor only if there is excessive duplication."). Most of the 33 flagged occurrences are test files (Django `setUpTestData`, Jasmine spec bodies, one PHP test method), so the current wording doesn't clearly cover them, even though these long test methods follow the same pattern the project already refactors elsewhere: repeated/duplicated fixture and setup code that belongs in shared helpers.

## Expected Behavior

- All 33 flagged methods, including the test/spec ones, drop back under their configured Lizard NLOC limit.
- Each fix comes from identifying actual sub-responsibilities (extracting cohesive chunks into well-named helper methods/functions/classes, or shared fixture-setup helpers for tests) — not mechanical line-splitting.
- `docs/agents/contributing.md`'s Definition of Done reflects this: the blanket specs/tests exemption is narrowed so long, low-cohesion test setup/spec methods are expected to be split (following the project's existing pattern of splitting test files and extracting shared setup helpers), while still not demanding refactors of genuinely simple/duplication-free tests.

## Solution

1. Strengthen `docs/agents/contributing.md`'s Definition of Done: narrow the specs/tests exemption so long, low-cohesion test setup/spec methods are expected to be split by extracting common/shared code into helper methods — not just source code — while still not mandating changes to simple tests with no meaningful duplication or length problem.
2. The actual per-file refactors are split into sub-issues, one per specialist domain, since they will be dispatched to different specialist agents:
   - #1166 — Backend: 7 Django `setUpTestData` methods in `backend/uploads/tests/`
   - #1167 — Frontend: 24 methods across React components/helpers and Jasmine specs
   - #1168 — Proxy: 1 PHP test method in `proxy/extension/tests/handlers/UploadHandlerTest.php`

For each flagged method (see each sub-issue for its full list), extract cohesive chunks into well-named helper methods/functions/classes based on actual sub-responsibilities — not mechanical line-splitting. Several backend occurrences are `setUpTestData` methods, where extracting per-fixture helper methods is the natural split.

## Benefits

- Improved readability, testability, and maintainability across backend, frontend, and proxy code.
- Passes the Codacy Lizard complexity check.
- Clarifies the project's shared convention so future long test/spec methods are refactored consistently instead of relying on an exemption that didn't match actual practice.
