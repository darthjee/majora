# Refactor: fix misconfigured Stylelint rule name "scss_function-disallowed-list"

## Context

Codacy's Stylelint scan (`scss_function-disallowed-list`, BestPractice, Warning severity) reports `Unknown rule scss_function-disallowed-list. Did you mean function-disallowed-list?` on both `crawler/navi-extension/src/frontend/EnqueuePage.css:1` and `frontend/assets/css/styles.css:1`. This means the Stylelint configuration itself has a typo'd/incorrect rule name, so the intended check (`function-disallowed-list`) is silently not being enforced at all across the whole project.

## What needs to be done

Frontend/Infra: find the Stylelint configuration entry using `scss_function-disallowed-list` (likely meant for the `stylelint-scss` plugin's naming convention) and correct it to the valid rule name (`function-disallowed-list`, or the plugin-prefixed equivalent it was actually meant to reference), then re-run Stylelint to confirm the rule now actually executes.

## Acceptance criteria

- [ ] The Stylelint config no longer references an unknown rule name
- [ ] `yarn lint` (or the project's Stylelint invocation) runs the intended function-disallowed-list check without an "unknown rule" warning
- [ ] Codacy's Stylelint `scss_function-disallowed-list` finding clears for both files
