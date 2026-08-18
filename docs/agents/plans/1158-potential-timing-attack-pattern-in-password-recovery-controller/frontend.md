# Frontend Plan: Potential timing-attack pattern in password recovery controller

Main plan: [plan.md](plan.md)

## Overview
Codacy's ESLint security plugins (`security/detect-possible-timing-attacks`, `security-node/detect-possible-timing-attacks`) flag `password !== confirmPassword` in `RecoverPasswordController#handleSubmit` (`frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js:73`) as a non-constant-time comparison. Confirmed as a false positive: the comparison runs entirely client-side, between two values the same user just typed into the form (new password and its confirmation) — it's a UX convenience only, not a secret/server-side comparison an attacker could time. No behavior change is needed; the finding should be suppressed with a justified inline comment.

## Implementation Steps

### Step 1 — Add a justified inline suppression
In `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js`, add an `eslint-disable-next-line` comment directly above the flagged comparison (line 73: `if (password !== confirmPassword) {`), following the codebase's existing convention (see `frontend/assets/js/utils/logging/MajoraLogger.js:67` and `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js:89` for the `// eslint-disable-next-line <rule> -- <reason>` shape).

Cover both rules Codacy reports, e.g.:

```js
// eslint-disable-next-line security/detect-possible-timing-attacks, security-node/detect-possible-timing-attacks -- client-side-only comparison of two values the same user just entered (new password vs. confirmation); no server secret or distinct attacker involved, see issue #1158
if (password !== confirmPassword) {
```

Confirm the exact rule id(s) Codacy reports for this specific line before finalizing the comment (the issue names both a `security/` and a `security-node/` rule as possible sources of the same finding — only include the id(s) actually firing here, to avoid an inert disable directive lingering for a rule that was never triggered).

### Step 2 — Verify locally
Run the frontend lint check and confirm the finding no longer surfaces and no new lint errors are introduced:

```bash
cd frontend && npm run lint
```

## Files to Change
- `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js` — add justified inline `eslint-disable-next-line` suppression above the `password !== confirmPassword` comparison in `handleSubmit`.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No test changes expected — this is a lint-suppression-only change with no behavior difference.
- If Codacy's own scan doesn't honor a plain ESLint `eslint-disable-next-line` comment (i.e. it still reports the finding after this change), fall back to whatever suppression mechanism Codacy documents for inline ignores (e.g. a `// codacy:disable` style comment) instead, keeping the same justification text.
