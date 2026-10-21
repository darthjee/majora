# Plan: Scoped API tokens: scope declarations for PCs

Issue: [1631-scoped-api-tokens-scope-declarations-for-pcs.md](../../issues/1631-scoped-api-tokens-scope-declarations-for-pcs.md)

## Overview
Declare `@token_scopes` on every PC view (`pcs.json`, every `pcs/<id>/…` route, PC photos and the
reverse-nested PC summaries), remove them from `PENDING_TOKEN_SCOPES`, and add per-family tests.
All the work is in `backend/`.

See [backend.md](backend.md) for the full plan.
