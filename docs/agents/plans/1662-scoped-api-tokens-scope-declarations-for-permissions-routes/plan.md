# Plan: Scoped API tokens: scope declarations for permissions routes

Issue: [1662-scoped-api-tokens-scope-declarations-for-permissions-routes.md](../../issues/1662-scoped-api-tokens-scope-declarations-for-permissions-routes.md)

## Overview

Declare `@token_scopes(GET=[])` on the last three permission routes still pending
(`permissions-game-pc`, `permissions-game-npc`, `permissions-game-document`), remove them from
`PENDING_TOKEN_SCOPES`, cover them with scoped-token tests and update the Status paragraph of
`token-scopes.md`. The other six routes listed in the issue were already declared by #1635 and
#1636.

See [backend.md](backend.md) for the full plan.
