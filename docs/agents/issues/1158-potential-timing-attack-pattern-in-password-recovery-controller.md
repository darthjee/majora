# Issue: Potential timing-attack pattern in password recovery controller

## Description
Codacy static analysis (ESLint rules `security/detect-possible-timing-attacks` and `security-node/detect-possible-timing-attacks`) flags the password-confirmation comparison in `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js` — specifically `password !== confirmPassword` in `handleSubmit` — as a non-constant-time comparison of secret data.

## Problem
That comparison runs entirely client-side, in the user's own browser, comparing two password values the same user just typed into the form (the new password and its confirmation). It exists purely as a UX convenience — the method's own doc comment already notes that the server remains the source of truth for token validity and password rules. No attacker distinct from the user submitting the form can observe or influence this comparison's timing, and no secret the user doesn't already know is involved. This is a false positive: the timing-attack pattern targets cases like comparing a submitted token/password against a server-held secret, which isn't what's happening here.

## Solution
Confirmed as a false positive — suppress the finding rather than introduce an unnecessary constant-time comparison. Add a justified inline suppression at the flagged line, following this codebase's existing `// eslint-disable-next-line <rule> -- <reason>` convention (see e.g. `frontend/assets/js/utils/logging/MajoraLogger.js`, `MemoryCacheCardController.js`), explaining that the comparison is client-side-only, between two values the same user just entered, with no server secret or distinct attacker involved.

## Benefits
Resolves the Codacy security finding without adding unnecessary complexity to a purely client-side UX check, and documents *why* the comparison is safe for future readers/maintainers and future Codacy scans.
