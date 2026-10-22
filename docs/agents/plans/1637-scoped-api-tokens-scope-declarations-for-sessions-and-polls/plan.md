# Plan: Scoped API tokens: scope declarations for sessions and polls

Issue: [1637-scoped-api-tokens-scope-declarations-for-sessions-and-polls.md](../../issues/1637-scoped-api-tokens-scope-declarations-for-sessions-and-polls.md)

## Overview

Declare `@token_scopes` on the 11 views of the `sessions` and `polls` families, remove them
from the coverage test's pending list, add per-family token-scope tests, and update the
token-scopes access-control doc.

See [backend.md](backend.md) for the full plan.
