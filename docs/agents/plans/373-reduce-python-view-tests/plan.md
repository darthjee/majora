# Plan: Reduce python view tests

Issue: [373-reduce-python-view-tests.md](../issues/373-reduce-python-view-tests.md)

## Overview

Trim `source/games/tests/views/` (50 files, ~6,900 lines) so view tests only own routing,
status codes, permission/access behavior, and response shape — not exhaustive field-by-field
content, which is already covered by `source/games/tests/serializers/`. Introduce a small
shared assertion helper for the "one request, check status + body" pattern, and use it while
trimming. Security-relevant tests (auth/permission checks, disallowed-field regression tests
per `docs/agents/security-guidelines.md` section 8) must be explicitly preserved. This is a
single-agent (backend) issue — no frontend, infra, or proxy changes are involved.

## Context

- CI currently splits `source/games/tests/views/` across three jobs
  (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) in `.circleci/config.yml`
  purely to keep runtime manageable — a symptom of the suite's size. Rebalancing/removing
  that split is explicitly out of scope for this issue.
- The `characters/` subtree is the largest offender. `game_npc_detail_test.py` (349 lines,
  the largest view test file) re-asserts almost every field and permission permutation
  already covered by `source/games/tests/serializers/test_character_detail.py` (192 lines)
  and `test_character_update.py` (117 lines, incl. the disallowed-field regression test
  `test_game_slug_is_not_included`-equivalent pattern).
  Its sibling `game_pc_detail_test.py` (267 lines) has the same shape.
- Other large files in the same subtree follow the same pattern: `game_npcs_test.py` (240),
  `game_treasures_test.py` (259, under `games/`), `upload_finalize_test.py` (381, top-level),
  `game_pc_treasure_acquire_test.py` / `game_npc_treasure_acquire_test.py` (183/189),
  `game_pc_treasure_sell_test.py` / `game_npc_treasure_sell_test.py` (164/195).
- No shared "assert status + body from one request" helper exists today
  (`source/games/tests/views/common_test.py` only tests `games/views/common.py` helpers,
  it is not itself a shared test helper). Some tests already make two near-identical
  requests (one to check `status_code`, one to check `response.content`) instead of
  asserting both from a single response object.
- Security-relevant tests that must be preserved verbatim (not deleted, only possibly
  deduplicated in setup) include, per file: the `can_edit` true/false checks, the hidden-NPC
  visibility gate (`TestGameNpcDetailHidden` in `game_npc_detail_test.py`), the
  401/403 PATCH permission checks (`TestGameNpcUpdateView`), and
  `test_patch_ignores_non_editable_fields` (the view-level echo of the serializer's
  disallowed-field regression test required by `docs/agents/security-guidelines.md`
  section 8).

## Implementation Steps

### Step 1 — Introduce a shared status+body assertion helper

Add a small helper (e.g. a `assert_json_response(response, status_code, **expected_fields)`
function, or a lightweight mixin/base test case) under
`source/games/tests/views/` (e.g. a new `source/games/tests/views/support.py` or similar,
matching whatever naming convention `source/games/tests/serializers/` or
`source/games/tests/factories/` already use for shared test support, if any exists — check
before inventing a new one). It should take a Django test `response`, assert
`response.status_code`, parse the JSON body once, and optionally assert a dict of expected
top-level fields — replacing the "two requests, one for status one for body" pattern
wherever it appears.

### Step 2 — Audit and trim `source/games/tests/views/characters/`

Starting with the largest files (`game_npc_detail_test.py`, `game_pc_detail_test.py`,
`game_npcs_test.py`, the treasure acquire/sell pairs), remove assertions that duplicate
`source/games/tests/serializers/` coverage (e.g. asserting every field of the detail
payload, every valid/invalid PATCH field individually) and keep only:
- Routing/status code checks (200/400/401/403/404) per endpoint and scenario.
- Permission/access checks (anonymous vs regular user vs owner vs DM vs superuser), since
  these are view-level concerns not covered by serializer tests.
- The hidden-NPC visibility gate.
- One representative "happy path" round-trip per endpoint (confirms the view wires the
  serializer correctly) — not an exhaustive field sweep.
- `test_patch_ignores_non_editable_fields` (or equivalent) as the view-level disallowed-field
  regression test.
- The `X-Skip-Cache` header assertions (view-specific behavior, not serializer-covered).

Apply the Step 1 helper wherever a test currently issues two requests to separately check
status and body.

### Step 3 — Audit and trim the remaining subtrees

Apply the same review to `source/games/tests/views/games/`, `treasures/`,
`game_masters/`, `game_sessions/`, `staff/`, and the top-level files
(`photo_upload_test.py`, `upload_finalize_test.py`, `health_test.py`), in that rough size
order. Not every file will need trimming — some (e.g. `health_test.py` at 25 lines) are
already minimal and should be left alone. Preserve authentication/permission tests and any
disallowed-field regression tests in every file touched.

### Step 4 — Verify coverage is preserved

Run the full backend test suite with coverage (see CI Checks below) and confirm no drop in
meaningful coverage for `games/views/` — the goal is removing *redundant* assertions, not
reducing exercised code paths. Re-check each trimmed file against
`docs/agents/security-guidelines.md` section 8 and the general security/access-control
checklist before considering it done.

## Files to Change

- `source/games/tests/views/characters/game_npc_detail_test.py` — trim to
  routing/permission/status/shape; keep hidden-NPC gate and disallowed-field regression test.
- `source/games/tests/views/characters/game_pc_detail_test.py` — same trim as its NPC sibling.
- `source/games/tests/views/characters/game_npcs_test.py` — trim exhaustive list-serialization
  assertions already covered by serializer tests.
- `source/games/tests/views/characters/game_pc_treasure_acquire_test.py`,
  `game_npc_treasure_acquire_test.py`, `game_pc_treasure_sell_test.py`,
  `game_npc_treasure_sell_test.py` — trim duplicated body assertions, keep status/permission
  checks.
- `source/games/tests/views/games/game_treasures_test.py`,
  `source/games/tests/views/upload_finalize_test.py` — audit and trim per Step 3.
- Remaining files under `source/games/tests/views/{games,treasures,game_masters,
  game_sessions,staff}/` — audited per Step 3; not all will need edits.
- A new shared helper module (exact path/name decided at implementation time, following
  existing test-support conventions in `source/games/tests/`) — introduced in Step 1 and
  adopted throughout.

## CI Checks

- `source/games/tests/views/characters/`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — run via `docker-compose run` against the backend service, never `poetry` directly on the host.
- `source/games/tests/views/` (excluding `characters/`): `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- Full backend suite: covered by CI job `pytest_all`.

## Notes

- The CircleCI 3-way pytest split itself must not change in this PR — only the content of
  the test files.
- Do not delete any test whose removal would drop coverage of a genuinely view-only concern
  (e.g. a permission edge case with no serializer-level equivalent) — the bar is "duplicates
  serializer coverage," not "is long."
- Coordinate with the `data-access` and `security` review steps after implementation, since
  this issue touches permission/access-control test coverage even though it adds no new
  endpoints or fields — those reviewers should confirm no security-relevant assertion was
  silently dropped during trimming.
