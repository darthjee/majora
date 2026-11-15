# Update the backend agent instructions

Replace the whole "### Tests (pytest + pytest-django)" section of `.claude/agents/backend.md` (from its heading through the end of its example code block, just before "## Small methods rule") with the exact text in #1786's "Agent instructions" section, including the new "New test files with no database access" bullet that #1786's edge cases added. Keep the other sections of the file unchanged. Check that the relative link `../../docs/agents/specs/pytest-all-long-test/isolation-policy.md` resolves from `.claude/agents/`.

In `.github/agents/backend.agent.md`, add one bullet under "## Project conventions": new test files use Django `TestCase` + `setUpTestData` (plain pytest classes when they never touch the database), existing `@pytest.mark.django_db` + `setup_method` files keep their style until converted, with a link to the same isolation policy page (relative from `.github/agents/`: `../../docs/agents/specs/pytest-all-long-test/isolation-policy.md`).

Do not touch any other `.claude/agents/*.md` file; #1788 updates job names later.

## Files to Change

- `.claude/agents/backend.md` — replace the Tests section.
- `.github/agents/backend.agent.md` — add the test-style bullet.
