# Issue: Frontend check script strips deliberate eslint-disable directives (lint_fix modifies files)

## Description
`.claude/scripts/check_frontend.sh` runs `yarn lint_fix` (`eslint assets specs --fix`), so the frontend check modifies tracked files. A check should only report problems.

## Problem
`frontend/assets/js/components/common/list_types/BaseListItem.js` has two deliberate directives, above `get formattedValue()` and `get availabilityText()`:

```js
// eslint-disable-next-line -- class-literal-property-style false positive, see justification above
```

They silence a rule from a plugin that Codacy's scan loads but the local ESLint config (`frontend/eslint.config.mjs`) does not. Local ESLint reports them as unused disable directives, and `--fix` removes them.

So every frontend check run, by any agent, strips both directives and leaves the file modified. This happened during #1702: the infra agent's check run left the stray change, and it had to be reverted by hand. If the change is ever committed, Codacy flags the two getters again.

## Expected Behavior
- Running the frontend checks never modifies tracked files.
- Both directives in `BaseListItem.js` stay in place.
- Lint errors still fail the check.

## Solution
Make every check script check-only, and stop ESLint from treating the directives as removable:

- `.claude/scripts/check_frontend.sh`: run `yarn lint` instead of `yarn lint_fix`.
- `frontend/eslint.config.mjs`: set `linterOptions: { reportUnusedDisableDirectives: 'off' }`, so a manual `yarn lint_fix` also keeps the directives.
- `.claude/scripts/check_backend.sh`: run `ruff check .` instead of `ruff check --fix .`.
- Update the development cycles in `.claude/agents/frontend.md` and `.claude/agents/backend.md` to use the check-only commands. The autofix commands can stay documented as optional tools.

## Acceptance Criteria
- [ ] Running `.claude/scripts/check_frontend.sh` (directly or through `check_infra.sh`) and `.claude/scripts/check_backend.sh` leaves `git status` clean.
- [ ] Both `eslint-disable-next-line` directives in `BaseListItem.js` are unchanged.
- [ ] `yarn lint_fix` also leaves both directives unchanged.
- [ ] Lint errors (ESLint and ruff) still make the checks fail.

## Benefits
Agents stop leaving stray edits in the working tree after running checks, and the Codacy suppressions can't be dropped by accident.
