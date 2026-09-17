# Plan: Refactor: fix misconfigured Stylelint rule name "scss_function-disallowed-list"

Issue: [1358-refactor-fix-misconfigured-stylelint-rule-name-scss-function-disallowed-list.md](../issues/1358-refactor-fix-misconfigured-stylelint-rule-name-scss-function-disallowed-list.md)

## Overview

Codacy's Stylelint scan flags an "unknown rule" for the pattern `scss_function-disallowed-list` on two CSS files. Investigation confirmed this repo has no local Stylelint setup at all (no config file, no dependency, no lint script) — Stylelint runs purely as one of Codacy's server-side engines, and the naming mismatch (`scss_function-disallowed-list` vs. the real `scss/function-disallowed-list`) is a bug in Codacy's own tool-integration/pattern configuration for this repo, not in any file inside the repository. There is therefore no code change to make here.

## Context

The `Stylelint_scss_function-disallowed-list` pattern is enabled for this repo in Codacy's per-repo tool settings, with its `function-disallowed-list` parameter left at the default `null` (no functions actually targeted). Since nothing in this repo's own files configures or invokes Stylelint, the fix is entirely an external action in Codacy's dashboard: disable the pattern for this repository. This clears the permanently-failing, no-op finding without pretending to enforce a check that never ran.

## Implementation Steps

### Step 1 — Disable the pattern in Codacy

In the Codacy dashboard for this repository, go to Repository → Settings → Code Patterns → Stylelint, and disable the `Disallow Specified SCSS Functions` pattern (id `Stylelint_scss_function-disallowed-list`). This is a Codacy configuration action, not a code change — there is no local file to edit for this step.

## Files to Change

None — no file in this repository configures or invokes Stylelint, so there is nothing to edit. This is purely a Codacy dashboard/API configuration change (see Step 1).

## Notes

- No local Stylelint config, dependency, or lint script exists anywhere in this repo; do not add one as part of "fixing" this issue — that was explicitly ruled out during issue discussion in favor of disabling the broken pattern.
- The underlying naming-mismatch bug lives in Codacy's own Stylelint tool integration (it doesn't translate its internal `scope_rule` pattern id into the real `scope/rule` Stylelint config key). Reporting it to Codacy support is optional and not required to close this issue.
- Acceptance is verified in Codacy's UI (the finding disappears on the next scan after the pattern is disabled), not via any local test or lint run.
