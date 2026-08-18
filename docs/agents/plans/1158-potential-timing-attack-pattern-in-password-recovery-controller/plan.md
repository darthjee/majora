# Plan: Potential timing-attack pattern in password recovery controller

Issue: [1158-potential-timing-attack-pattern-in-password-recovery-controller.md](../../issues/1158-potential-timing-attack-pattern-in-password-recovery-controller.md)

## Overview
Codacy flags the `password !== confirmPassword` comparison in `RecoverPasswordController#handleSubmit` as a non-constant-time comparison. It's a false positive: the comparison is client-side-only, between two values the same user just typed, with no server secret or distinct attacker involved. Suppress the finding with a justified inline `eslint-disable-next-line` comment, following the codebase's existing suppression convention.

See [frontend.md](frontend.md) for the full plan.
