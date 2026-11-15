# Write the policy pages

Each page starts with the same "Part of the ... specs (Epic #1785)." line.

- `isolation-policy.md` — **the rules only**, written so #1795 can move it into `docs/agents/testing.md` almost unchanged:
  - New test files that touch the database use Django `TestCase` + `setUpTestData`; new test files with no database access use plain pytest classes with no marker.
  - Existing `@pytest.mark.django_db` + `setup_method` files keep their style when edited; they are converted only by the dedicated conversion sub-issues, for modules the durations report shows as slow, one module or app per PR.
  - Parametrized modules stay in pytest style or switch to `subTest`; the conversion PR states which.
  - Real transactions (`TransactionTestCase`, `django_db(transaction=True)`) only when the test needs committed data, with a justification comment directly above.
  - Database-writing fixtures scoped to a class, module or session are forbidden.
  - `TestCase` equivalents: `self.client`, `unittest.mock.patch`, `self.assertNumQueries`, `self.subTest`; plain `assert` still used.
  - Placeholders for rules added later: autouse cache fixture (#1789), `TokenFactory` (#1790), history opt-in (#1792), `base_game` builder (#1793).
  - A short "Why" subsection: the options A to D from #1785 and why D was chosen.
- `edge-cases.md` — from #1785's Edge cases and #1786's Edge cases: the 10 transactional test files (grouped: concurrency, reset/clear, migration) with the note that all run in `pytest_all`; the 13 history test files and the opt-in that must restore state; the shared in-memory cache and why an autouse fixture can surface hidden dependencies; shared-scope setup (`setUpTestData` rollback and deep copy vs leaking module fixtures); factories (unique token key, approved profile stays the default); `--reuse-db` and migrations; tests without a database; in-flight branches written to the old instructions.
- `verification.md` — the checklist every Epic PR follows (same `pytest --collect-only -q` node IDs except listed renames; all green with no skips, `xfail` or deletions; Codacy coverage not lower; before/after timings reported and added to `baseline.md`), the specific checks per sub-issue (#1788 union of collected tests, #1789 fixed tests listed, #1792 history default test, conversions run alone and in the suite, xdist same results), and the check-script rules table (rule, added by: #1789 cache, #1790 tokens, #1793 transaction comments and fixture scopes), all marked "not yet added". State that "new tests use `TestCase`" is enforced by agent instructions and review, not by the script.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/isolation-policy.md` — new.
- `docs/agents/specs/pytest-all-long-test/edge-cases.md` — new.
- `docs/agents/specs/pytest-all-long-test/verification.md` — new.
