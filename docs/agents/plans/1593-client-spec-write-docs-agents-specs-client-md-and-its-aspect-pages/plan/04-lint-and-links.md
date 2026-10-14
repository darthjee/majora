# Lint and link check

1. Run markdownlint through docker-compose (`docker-compose run --rm markdownlint`, which runs
   `yarn lint_md`) and fix any violations in the new pages.
2. Check that every relative link resolves:
   - from the hub to each aspect page;
   - from the aspect pages back to the hub and to each other;
   - from `docs/agents/specs.md` to the hub;
   - from any page to existing docs or code paths.
3. Check that all eight pages exist and that each aspect page has the four template sections.

## Files to Change

- Any of the pages above, only to fix lint or link problems.
