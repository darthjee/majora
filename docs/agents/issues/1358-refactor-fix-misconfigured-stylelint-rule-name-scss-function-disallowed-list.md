# Issue: Refactor: fix misconfigured Stylelint rule name "scss_function-disallowed-list"

## Description
Codacy's Stylelint scan reports the pattern `scss_function-disallowed-list` (BestPractice, Warning severity, enabled for this repo) with the message `Unknown rule scss_function-disallowed-list. Did you mean function-disallowed-list?` on both `crawler/navi-extension/src/frontend/EnqueuePage.css:1` and `frontend/assets/css/styles.css:1`.

## Problem
Investigation shows this repo has **no local Stylelint setup at all**: no `.stylelintrc*`/`stylelint.config.*` file, no `stylelint` dependency in any `package.json`, and no lint script invokes it (`frontend`'s `lint` script only runs ESLint). Stylelint runs purely as one of Codacy's own server-side analysis engines for this repo (like Prospector, Bandit, or PMD), configured entirely through Codacy's per-repo tool/pattern settings rather than through any file inside the repository (confirmed via Codacy's API: the Stylelint tool has `hasConfigurationFile: false` / `usesConfigurationFile: false`).

Codacy's own pattern catalog names this pattern `Stylelint_scss_function-disallowed-list`, following its internal `Tool_scope_ruleName` convention. The real `stylelint-scss` plugin rule is `scss/function-disallowed-list` (scope and rule name joined by a slash `/`), not `scss_function-disallowed-list` (joined by an underscore `_`). It appears Codacy's Stylelint engine integration passes its internal pattern id through to the generated Stylelint config almost as-is instead of translating the scope separator, so Stylelint receives an unrecognized rule name and never actually runs the intended check.

Because there is no in-repo Stylelint configuration, **there is nothing inside this repository's own files to edit** to fix the naming mismatch — the bug lives in Codacy's Stylelint tool integration/pattern configuration for this repo, which is managed outside the codebase (Codacy dashboard/API), not in a committed config file.

The pattern's `function-disallowed-list` parameter is also currently unset (default `null`) — no SCSS functions are actually targeted for disallowing, so even a working rule would enforce nothing today.

## Solution
Since there is no in-repo config to correct, resolve this by disabling the `Stylelint_scss_function-disallowed-list` pattern for this repository directly in Codacy (Repository → Settings → Code Patterns → Stylelint), rather than changing anything in the codebase. This stops the noisy/broken "unknown rule" finding without pretending to enforce a check that never actually ran. No specific SCSS functions need to be disallowed at this time — the goal is purely to clear the misconfigured finding.

## Benefits
- Removes a permanently-failing, no-op Codacy finding that can never be resolved by changing repo code
- Avoids wasted future effort re-investigating a "broken lint rule" that is actually a Codacy tool-integration issue outside this repo's control
