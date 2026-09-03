# Plan: Backend — clamp password reset token expiration to [1, 1440] minutes

Issue: [1246-backend---clamp-password-reset-token-expiration-to--1--1440--minutes.md](../../issues/1246-backend---clamp-password-reset-token-expiration-to--1--1440--minutes.md)

## Overview

Clamp `Settings.password_reset_token_expiration_minutes()` to `[1, 1440]` minutes, add boundary test coverage, and document the range in `.env.dev.sample`.

See [backend.md](backend.md) for the full plan.
