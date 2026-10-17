# Plan: Make model status columns database-level enums

Issue: [1626-make-model-status-columns-database-level-enums.md](../../issues/1626-make-model-status-columns-database-level-enums.md)

## Overview
Add a reusable `EnumCharField` (MySQL `ENUM` built from `choices`, `varchar` fallback elsewhere) in `backend/common/`, switch the `status` field of `AuthorizationRequest`, `UserProfile`, `Upload` and `Poll` to it with one migration per app, and keep the `AuthorizationRequest` history table's `status` a plain `varchar`. Backend-only work.

See [backend.md](backend.md) for the full plan.
