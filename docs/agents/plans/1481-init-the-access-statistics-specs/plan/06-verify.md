# Verify

1. **Lint:** run `docker-compose run --rm markdownlint yarn lint_md` and fix any findings,
   especially blank lines around headings and lists.
2. **Links:** every relative link in the hub and the pages resolves. That covers the hub ↔
   pages links, `../../specs.md`, `../../access-control/...`, and `../../pagination.md`. Links
   to docs that may not exist yet (`access-control/statistics.md`, `staff-statistics.md`) are
   written as plain code paths with a "(created by #14xx)" note, not as Markdown links, so no
   link is ever broken.
3. **Fidelity:**
   - check each page against the live #1477 sections it transcribes;
   - check each stub's "To define" items against its owning issue;
   - confirm no new decision has slipped in.
4. **Acceptance criteria** of #1481: walk them one by one.

## Files to Change

- None beyond fixes to the files created in steps 01 to 05.
