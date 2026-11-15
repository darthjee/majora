# Issue: Backend tests speed: write the specs

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). CI is currently held up by the `pytest_all` job at 8m 34s; `pytest_views_characters` takes 5m 04s and `pytest_views_rest` 3m 35s (pipeline 5881).

Write the Epic's specs in `docs/agents/specs/pytest-all-long-test.md`, split into `docs/agents/specs/pytest-all-long-test/*.md`, from the content of #1785. They are the shared reference for every later sub-issue. Also point the backend agent's test instructions at the new isolation policy, so new tests stop following the slow pattern from now on.

## Problem

The Epic's sub-issues (CI durations and rebalancing, cache fixture, `TokenFactory`, factory and history changes, transactional test comments, local ergonomics, module conversions) each need the same context: the baseline, the cost drivers and how each is confirmed, the target isolation policy and its edge cases, and how CI jobs are split. Without a written spec each sub-issue re-derives it.

Meanwhile `.claude/agents/backend.md` (Tests section) tells agents to decorate test classes with `@pytest.mark.django_db` and to use `setup_method` for per-test fixtures, which is the pattern the Epic replaces. Every new agent-written test adds to the cost.

## Expected Behavior

- `docs/agents/specs/pytest-all-long-test.md` exists as the hub, registered in `docs/agents/specs.md` under "Active specs". It holds the overview, the sub-issue table (number, title, agent, depends on, pages) listing #1786 to #1795 by their real GitHub numbers, the sequencing, and the definition of done, plus a note that the module conversion sub-issues are added once #1787 names the slow modules.
- These aspect pages exist under `docs/agents/specs/pytest-all-long-test/`:

  | Page | Content | Later updated by |
  | --- | --- | --- |
  | `baseline.md` | The CI timings from pipeline 5881 and how before/after runtime is measured. Its "Local" section is a placeholder stating that #1794 measures the local baseline. | #1787, #1788, #1794, every PR (timings) |
  | `cost-drivers.md` | The cost drivers and hypotheses from #1785, each marked confirmed, ruled out or open, with how it is confirmed or ruled out. | #1787, #1790 to #1792 |
  | `isolation-policy.md` | **The rules only** (option D from #1785), written so #1795 can move it into `docs/agents/testing.md` almost unchanged. | #1789, #1793 |
  | `edge-cases.md` | The 10 transactional test files, the 13 history test files, the shared in-memory cache, shared-scope setup, factories and `--reuse-db`. | as each is handled |
  | `conversions.md` | The test-style file counts (see "Counting test styles" below), the exact command that produced them, and the table of converted modules (empty for now). | each module conversion (re-runs the recorded command) |
  | `verification.md` | The checklist every PR of the Epic follows (same collected tests, all green, no coverage drop, timing reported) and the check-script rules, each with the sub-issue that adds it (#1789, #1790, #1793). | #1789, #1790, #1793 |
  | `ci-jobs.md` | How pytest jobs are split today, the durations report, and the rebalancing approach. | #1787, #1788 |

- There is no separate plan page: the hub carries the sub-issue order and the definition of done.
- The Tests section of `.claude/agents/backend.md` is replaced with the text in "Agent instructions" below, and `.github/agents/backend.agent.md` gets the matching bullet.
- The pages pass markdownlint.

## Solution

Docs only: no code, test, CI or configuration change, and no test run. The per-app counts come from a search of the test files, not from running the suite. The local baseline is out of scope: #1794 measures it before and after its own change, on the same machine, so the comparison is fair. Follow the shape of the existing Statistics Bug spec (`docs/agents/specs/statistics-bug.md` and its folder). Use kebab-case names. The isolation policy content:

- New tests use Django `TestCase` + `setUpTestData`.
- Existing pytest-style modules first get the cheap fixes (cache fixture, `TokenFactory`, optional `UserProfile`, history off), and are converted to `TestCase` only when the durations report shows them as slow, one module or app per PR, never just because a module was touched for another reason.
- Parametrized modules either stay in pytest style or switch to `subTest`; the conversion PR states which.
- `TransactionTestCase` or `django_db(transaction=True)` requires a justification comment directly above it.
- Database-writing fixtures scoped to a class, module or session are forbidden (they are not rolled back per test).

### Counting test styles

The counts in `conversions.md` are a one-off measurement taken by this sub-issue. No script is added. The exact command used is recorded on the page, next to the numbers, so each module conversion can re-run it and update the table.

- **Unit:** test files (`*_test.py`), per app and per top-level test folder (for example `games/tests/models/` vs `games/tests/views/`).
- **Buckets** (each file falls in exactly one, so totals add up):
  1. Django `TestCase`: a direct subclass, or one through a project base class.
  2. `@pytest.mark.django_db` without `transaction=True`.
  3. Transactional: `TransactionTestCase` or `django_db(transaction=True)`.
  4. Mixed: the file uses more than one of the patterns above.
  5. No database: pure unit tests.
- The rough counts from #1785 (193 `TestCase` files, 387 `django_db` files) are a starting point only. The recorded numbers come from the bucket definition above.

### Agent instructions

Replace the "Tests (pytest + pytest-django)" section of `.claude/agents/backend.md` with:

````markdown
### Tests (pytest + pytest-django)

Full policy: [isolation policy](../../docs/agents/specs/pytest-all-long-test/isolation-policy.md).

- Test files live in `backend/<app>/tests/`, named `<module>_test.py`.
- **New test files** use Django `TestCase`. Build the data every test needs once per class in
  `setUpTestData` (a `@classmethod`), never in `setup_method`/`setUp`.
- **New test files with no database access** (pure unit tests) use plain pytest classes with no
  marker, not `TestCase`, so they pay no database setup.
- **Existing `@pytest.mark.django_db` + `setup_method` files** keep their style when you add or
  edit tests in them. They are converted only by the dedicated conversion issues, never as a side
  effect of another change.
- Never write to the database from a pytest fixture scoped to a class, module or session: it is
  not rolled back between tests.
- Use real transactions (`TransactionTestCase`, `@pytest.mark.django_db(transaction=True)`) only
  when the test needs committed data (threads, migrations), with a comment directly above saying why.
- Inside `TestCase`: `self.client` instead of the `client` fixture, `unittest.mock.patch` instead of
  `monkeypatch`, `self.assertNumQueries` instead of `django_assert_num_queries`, and `self.subTest`
  or separate methods instead of `@pytest.mark.parametrize` (not supported in `TestCase`).
- Each test method has a one-line docstring.
- Use plain `assert` (it works inside `TestCase` under pytest); no `unittest` `assert*` methods,
  except the `assertNumQueries` context manager.

Example structure:
```python
class TestGame(TestCase):
    """Tests for the Game model."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game shared by every test in the class."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_name(self):
        """Test that the game keeps its name."""
        assert self.game.name == 'Test Game'
```
````

In `.github/agents/backend.agent.md`, add one bullet under "Project conventions": new test files use Django `TestCase` + `setUpTestData`, existing `@pytest.mark.django_db` + `setup_method` files keep their style until converted, with a link to the same isolation policy page.

Notes:

- The example deliberately creates no token and clears no cache, so it stays correct after #1789 (cache fixture) and #1790 (`TokenFactory`). Those rules live in the policy page only.
- New tests added to an existing pytest-style file follow that file's style, so files are not mixed and conversions stay in their own PRs.
- `games/tests/views/photo_upload_test.py` is an existing example of the target style.

### Edge cases

- **Tests without a database.** A new test file that never touches the database uses a plain pytest class with no marker, not `TestCase`, so it pays no database setup. Covered by the instructions above.
- **Branches written to the old instructions.** Pull requests already in flight may still add `@pytest.mark.django_db` + `setup_method` test files after this lands. This is accepted: they are not converted retroactively, and the next re-count in `conversions.md` simply includes them.
- **Count drift.** The counts are a snapshot. `conversions.md` records the commit SHA they were taken on, next to the command, so a later re-count can be compared like for like.
- **Mixed files.** Files that already mix patterns are counted in the "mixed" bucket and left for the conversion sub-issues; the new rule (new tests follow the file's existing style) does not create more of them.
- **Link lifetime.** The agent instructions link to a spec page that #1795 deletes. #1795 repoints the links at `docs/agents/testing.md` in the same change, so the link never breaks in between.
- **Same rule for every agent tool.** `.github/agents/backend.agent.md` (used by GitHub Copilot) gets the same rule and link, so both tools write tests the same way. No other doc (`AGENTS.md`, `docs/agents/*.md`) prescribes a test style today, so nothing else needs changing.

### Verification

- The `markdownlint` CI job passes for every new and changed page.
- Every relative link in the new pages and in the changed agent instructions resolves to an existing file.
- No `data-access` or `security` review is needed: nothing touches endpoints, serializers, access rules or user input.

### Permissions, performance and security

Not applicable: docs only, no runtime change.

## Benefits

- Every later sub-issue of Epic #1785 works from one shared, written reference instead of re-deriving the baseline, cost drivers, policy and edge cases.
- Agents stop writing new tests in the slow `@pytest.mark.django_db` + `setup_method` pattern from the day this lands, before any test is converted.
- The isolation policy is written as its own page, so #1795 can move it into `docs/agents/testing.md` almost unchanged.
