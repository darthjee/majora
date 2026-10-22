# Plan: Scoped API tokens: scope declarations for game photos

Issue: [1665-scoped-api-tokens-scope-declarations-for-game-photos.md](../../issues/1665-scoped-api-tokens-scope-declarations-for-game-photos.md)

## Overview

Declare `@token_scopes` on the two game photo views (the last entries in `PENDING_TOKEN_SCOPES`), delete the pending set from the coverage test, add scoped-token tests and update `token-scopes.md`. All work is backend-owned.

See [backend.md](backend.md) for the full plan.
