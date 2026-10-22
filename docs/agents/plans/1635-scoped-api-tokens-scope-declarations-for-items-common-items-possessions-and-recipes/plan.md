# Plan: Scoped API tokens: scope declarations for items, common items, possessions and recipes

Issue: [1635-scoped-api-tokens-scope-declarations-for-items-common-items-possessions-and-recipes.md](../../issues/1635-scoped-api-tokens-scope-declarations-for-items-common-items-possessions-and-recipes.md)

## Overview

Declare `@token_scopes` on the 27 pending views of the `items`, `common_items`, `possessions`
and `recipes` families (including their `permissions/game_*.json` routes), drop them from
`PENDING_TOKEN_SCOPES`, add end-to-end token-scope tests and update the token-scopes doc. All
work is in the backend agent's scope.

See [backend.md](backend.md) for the full plan.
