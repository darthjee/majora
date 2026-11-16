# Backend Tests Speed

Specs for Epic #1785. The backend pytest suite is slow: CI's critical path is the `pytest_all`
job at **8m 34s** (pipeline 5881), and the suite has no single test isolation policy. The Epic
makes both CI and the local feedback loop faster, **CI first**, through measured, low-risk
sub-issues: a durations report, CI rebalancing, cheaper factories and fixtures, and module
conversions driven by measurement. These pages are the shared reference for every sub-issue:
the baseline, the cost drivers, the target isolation policy, its edge cases, the conversion
state, the verification checklist and how the CI jobs are split.

## Aspect pages

- [Baseline](pytest-all-long-test/baseline.md): CI timings from pipeline 5881, how before/after
  runtime is measured, the local baseline (measured by #1794) and the targets.
- [Cost drivers](pytest-all-long-test/cost-drivers.md): the observed cost drivers and the
  hypotheses, each with its status and how it is confirmed or ruled out.
- [Isolation policy](pytest-all-long-test/isolation-policy.md): the rules only, the draft of the
  future `docs/agents/testing.md`.
- [Edge cases](pytest-all-long-test/edge-cases.md): transactional tests, history tests, the
  shared in-memory cache, shared-scope setup, factories and `--reuse-db`.
- [Conversions](pytest-all-long-test/conversions.md): the test-style file counts per app and
  folder, the command that produced them, and the table of converted modules.
- [Verification](pytest-all-long-test/verification.md): the checklist every PR of the Epic
  follows and the check-script rules, with the sub-issue that adds each one.
- [CI jobs](pytest-all-long-test/ci-jobs.md): how the pytest jobs are split today, the
  durations report and the rebalancing approach.

## Sub-issues

Status lives on GitHub: see Epic #1785's sub-issues. This table maps each sub-issue to the spec
pages it follows and updates.

| Issue | Title | Agent | Depends on | Page(s) |
|-------|-------|-------|------------|---------|
| #1786 | Write the specs | architect | — | all |
| #1787 | Publish a durations report for every pytest job | infra | #1786 | [CI jobs](pytest-all-long-test/ci-jobs.md), [Baseline](pytest-all-long-test/baseline.md), [Cost drivers](pytest-all-long-test/cost-drivers.md) |
| #1788 | Rebalance the CI pytest jobs | infra | #1787 | [CI jobs](pytest-all-long-test/ci-jobs.md), [Baseline](pytest-all-long-test/baseline.md) |
| #1798 | Make the two slow migration tests cheap | backend | #1787 | [Baseline](pytest-all-long-test/baseline.md), [Cost drivers](pytest-all-long-test/cost-drivers.md) |
| #1802 | Split the view test jobs into parallel containers | infra | #1788 | [CI jobs](pytest-all-long-test/ci-jobs.md), [Baseline](pytest-all-long-test/baseline.md) |
| #1789 | Autouse memory cache fixture and test-policy check script | backend (infra for the `checks` job) | #1786 | [Isolation policy](pytest-all-long-test/isolation-policy.md), [Edge cases](pytest-all-long-test/edge-cases.md), [Verification](pytest-all-long-test/verification.md) |
| #1790 | Add `TokenFactory` and replace manual token creation | backend | #1789 | [Cost drivers](pytest-all-long-test/cost-drivers.md), [Verification](pytest-all-long-test/verification.md) |
| #1791 | Make the `UserProfile` write in `UserFactory` optional | backend | #1786 | [Cost drivers](pytest-all-long-test/cost-drivers.md) |
| #1792 | Disable `simple_history` in tests with an opt-in | backend | #1786 | [Cost drivers](pytest-all-long-test/cost-drivers.md), [Edge cases](pytest-all-long-test/edge-cases.md) |
| #1793 | Justify transactional tests and add a shared `base_game` builder | backend | #1789 | [Isolation policy](pytest-all-long-test/isolation-policy.md), [Edge cases](pytest-all-long-test/edge-cases.md), [Verification](pytest-all-long-test/verification.md) |
| #1794 | Local test ergonomics (`--reuse-db` and `tests-fast`) | backend, infra | #1786 | [Baseline](pytest-all-long-test/baseline.md) |
| #1795 | Remove the specs and publish the testing policy | architect | all others | all |

Sub-issues are referenced by their GitHub number. The **module conversion** sub-issues (one per
module or app, converting slow modules to Django `TestCase` + `setUpTestData`) are added to this
table once the durations report (#1787) names the slow modules; each updates
[Conversions](pytest-all-long-test/conversions.md) and must land before #1795. A `pytest-xdist`
evaluation is a possible follow-up only, not created. When a sub-issue is added or dropped,
update this table.

## Sequencing

1. #1786 first.
2. #1787, then #1788, then #1802 (all edit `.circleci/config.yml`).
3. #1789, #1791, #1792 and #1794 in parallel, alongside the CI work.
4. #1790 and #1793 after #1789, because they extend the check script it creates.
5. The module conversions, once #1787 names the slow modules, before #1795.
6. #1795 last.

## Definition of done

- The CI workflow wall-clock time and the local full-run time are both measurably lower than the
  baselines in [Baseline](pytest-all-long-test/baseline.md), and the before and after numbers
  are stated on the Epic.
- A durations report is published for every pytest job.
- The CI pytest jobs are balanced, and their names match what they run.
- A written isolation policy exists in `docs/agents/testing.md`, is referenced from `AGENTS.md`
  and from the backend agent instructions, and the check script keeps it enforced.
- Every `TransactionTestCase` or `django_db(transaction=True)` has a justification comment.
- No database-writing fixture is scoped to a class, module or session.
- No test file clears `memory_cache` by hand; an autouse fixture does it.
- `TokenFactory` exists, and no test file calls `Token.objects.create`.
- `simple_history` is off in tests by default, with an opt-in for the tests that assert on
  history, and stays on in production.
- A documented fast local command runs without coverage (`make tests-fast`).
- The spec files under `docs/agents/specs/pytest-all-long-test*` are removed.

## Lifecycle

- **During the Epic:** a sub-issue that has to deviate from these pages updates the relevant
  page in the same PR, so the specs stay the source of truth. Every PR that changes timings adds
  its before/after numbers to [Baseline](pytest-all-long-test/baseline.md).
- **Removal:** #1795, after every other sub-issue (including the module conversions) has landed:
  1. move the [Isolation policy](pytest-all-long-test/isolation-policy.md) into
     `docs/agents/testing.md` and reference it from `AGENTS.md`, `docs/agents/index.md` and
     `docs/agents/summary.md`, together with the fast local command;
  2. repoint the backend agent instructions (`.claude/agents/backend.md` and
     `.github/agents/backend.agent.md`) at `docs/agents/testing.md`, in the same change;
  3. unregister this index from [Specs](../specs.md);
  4. delete this file and `docs/agents/specs/pytest-all-long-test/`.
- **Dropped, not migrated:** the baseline numbers, cost drivers, hypotheses and the conversion
  table. The Epic and git history keep them.
- Permanent docs must **not** link into `docs/agents/specs/pytest-all-long-test/`. The one
  deliberate, temporary exception is the backend agent instructions, which link to
  [Isolation policy](pytest-all-long-test/isolation-policy.md) from #1786 on, so new tests stop
  following the slow pattern before any test is converted. #1795 repoints that link at
  `docs/agents/testing.md` in the same change that deletes the spec, so it never breaks.
