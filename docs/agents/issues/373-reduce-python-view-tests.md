# Reduce python view tests

## Context

The Python view test suite under `source/games/tests/views/` has grown large (50 files, ~6,900 lines), forcing CircleCI to split it into three parallel jobs (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) just to keep run time manageable. Much of the size comes from view tests re-verifying behavior that is already covered more precisely at the serializer level.

- View tests frequently re-assert exhaustive field-level output (e.g. every field and every permission permutation of a nested serializer) that is already covered by dedicated serializer tests. Example: `source/games/tests/views/characters/game_npc_detail_test.py` (349 lines) duplicates most of the scenarios already in `source/games/tests/serializers/test_character_detail.py`.
- Some tests exercise the same endpoint twice (one request to check the status code, another near-identical request to check the response body) instead of asserting both from a single request/response. There is no shared helper for this today, so each file re-implements the pattern (or skips it) inconsistently.
- Security-relevant checks (permission/access-control tests, and the disallowed-field regression tests required by `docs/agents/security-guidelines.md` section 8) must not be casualties of trimming — they need to be identified and explicitly preserved during cleanup.
- The test suite must keep good coverage even as redundant assertions are removed.

## What needs to be done

- Audit the full `source/games/tests/views/` tree (not just the `characters/` subtree, though it's the largest and a good starting point) and trim tests to what a view test should uniquely own: routing, status codes, permission/access behavior, and response shape — not exhaustive field-by-field content, which stays the responsibility of the serializer tests.
- Introduce a small shared assertion helper (or lightweight base test case) for the recurring "check status code and body from one request" pattern, and use it wherever a test currently makes two requests to check those separately.
- Explicitly keep (and where useful, clearly mark) security-relevant tests: authentication/permission checks and the update-serializer disallowed-field regression tests, per `docs/agents/security-guidelines.md` section 8.
- The CircleCI 3-way pytest split (`pytest_views_characters` / `pytest_views_rest` / `pytest_all`) is out of scope for this issue — rebalancing it, if warranted by the reduced runtime, should be handled as a separate follow-up.

## Acceptance criteria

- [ ] Redundant field-by-field exhaustive assertions in `source/games/tests/views/` that duplicate serializer-level coverage are removed, starting with the `characters/` subtree.
- [ ] A shared helper (or lightweight base test case) exists for asserting status code and response body from a single request, and is adopted wherever tests previously made two near-identical requests to check those separately.
- [ ] Security-relevant tests (authentication/permission checks and disallowed-field regression tests per `docs/agents/security-guidelines.md` section 8) are preserved and still pass.
- [ ] Overall `source/games/tests/views/` line count and file count are meaningfully reduced while test coverage is maintained.
- [ ] The CircleCI 3-way pytest split configuration itself is left unchanged by this issue.

---
Tags: :shipit:
