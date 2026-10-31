# Plan: Frontend check script strips deliberate eslint-disable directives (lint_fix modifies files)

Issue: [1722-frontend-check-script-strips-deliberate-eslint-disable-directives-lint-fix-modifies-files.md](../../issues/1722-frontend-check-script-strips-deliberate-eslint-disable-directives-lint-fix-modifies-files.md)

## Overview
Make the frontend and backend check scripts check-only, so running checks never edits tracked files. Also turn off ESLint's unused-disable-directive reporting, so even a manual `yarn lint_fix` keeps the two Codacy-only directives in `BaseListItem.js`. The agents' documented development cycles move to the check-only commands.

## Agents involved

- [frontend](frontend.md)
- [backend](backend.md)

## Shared contracts

None. The two changes are independent. Both follow the same rule: `.claude/scripts/check_<area>.sh` only reports problems, it never rewrites files, and it still exits non-zero on lint errors (`set -euo pipefail` is already in place).
