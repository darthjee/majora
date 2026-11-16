# Measure after, record the target and update the docs

Once infra's `make tests-fast` exists:

1. Run `make tests-fast` once to make sure `test_majora` exists with the current schema, then time a
   second full run (`time make tests-fast`) on the same machine as step 01. It must be measurably
   faster than the no-coverage baseline. If it is not, report it instead of tuning tests.
2. Update `docs/agents/specs/pytest-all-long-test/baseline.md`:
   - **Local:** replace the placeholder with the machine description and a table of the three
     numbers (baseline without `--cov`, baseline with `--cov`, `make tests-fast` with a reused
     database), wall-clock and pytest time, and the test count.
   - **Targets:** the local target is the measured `make tests-fast` time; later sub-issues must not
     make a full `make tests-fast` run slower.
   - **History:** add a #1794 row (local machine; before = no-coverage baseline; after = reused
     `make tests-fast`).
3. Update `docs/agents/specs/pytest-all-long-test/edge-cases.md` (`--reuse-db` section): all
   worktrees share `majora_mysql` and its `test_majora`, so a reused database can carry another
   branch's schema; CI and `check_backend.sh` always pass `--create-db`; pass `--create-db` after
   pulling or writing migrations, after switching to a branch with different migrations, and after an
   interrupted migration test.
4. Update `AGENTS.md` (Development section, next to the `docker-compose run --rm majora_tests pytest`
   example) and `README.md` (Running Tests): local runs reuse `test_majora`; when to pass
   `--create-db` (same three cases); `make tests-fast` (and `ARGS=`) is the fast local command.
5. Update `docs/agents/specs/pytest-all-long-test/verification.md` if it tracks #1794's status.
6. The PR description lists the local before and after numbers, and the CI pytest job times showing
   CI is unchanged (each container still creates the test database).

## Files to Change

- `docs/agents/specs/pytest-all-long-test/baseline.md` — Local, Targets, History.
- `docs/agents/specs/pytest-all-long-test/edge-cases.md` — `--reuse-db` section.
- `docs/agents/specs/pytest-all-long-test/verification.md` — #1794 status, if tracked there.
- `AGENTS.md` — Development section.
- `README.md` — Running Tests.
