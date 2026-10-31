# Frontend Plan: Frontend check script strips deliberate eslint-disable directives (lint_fix modifies files)

Main plan: [plan.md](plan.md)

## Shared contracts

`.claude/scripts/check_frontend.sh` must only report problems: no file changes, non-zero exit on lint errors.

## Implementation Steps

### Step 1 — Make the frontend check check-only
In `.claude/scripts/check_frontend.sh`, replace `docker-compose run --rm majora_fe yarn lint_fix` with `docker-compose run --rm majora_fe yarn lint`. ESLint exits non-zero on errors, so lint errors still fail the script.

In `frontend/eslint.config.mjs`, add `linterOptions: { reportUnusedDisableDirectives: 'off' }` (a top-level config object, or inside the main `files: ['**/*.{js,jsx,mjs}']` block). Local ESLint does not load the plugin whose rule the two `BaseListItem.js` directives silence, so it sees them as unused. With reporting off, `--fix` no longer removes them and `yarn lint` no longer warns about them.

### Step 2 — Update the frontend agent's development cycle
In `.claude/agents/frontend.md`, change the "Development cycle" check step from `yarn lint_fix` to `yarn lint`. Keep `yarn lint_fix` in the "Commands" list as an optional auto-fix tool, with a note that agents review its diff before committing.

## Files to Change
- `.claude/scripts/check_frontend.sh` — `yarn lint_fix` → `yarn lint`
- `frontend/eslint.config.mjs` — add `linterOptions.reportUnusedDisableDirectives: 'off'`
- `.claude/agents/frontend.md` — development cycle uses `yarn lint`

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe yarn test` and `docker-compose run --rm majora_fe yarn lint` (CI runs `yarn lint`)

## Notes
- Verify: run `.claude/scripts/check_frontend.sh`, then `docker-compose run --rm majora_fe yarn lint_fix`. After both, `git status` must show no change to `frontend/assets/js/components/common/list_types/BaseListItem.js`; both `// eslint-disable-next-line -- class-literal-property-style false positive, see justification above` lines must still be there.
- Do not touch `BaseListItem.js` itself.
