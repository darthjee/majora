# Plan: Scoped API tokens: scope declarations for miniatures

Issue: [1638-scoped-api-tokens-scope-declarations-for-miniatures.md](../../issues/1638-scoped-api-tokens-scope-declarations-for-miniatures.md)

## Overview
Declare `@token_scopes` on the 11 views of the `miniatures` family: reads need `miniatures:read` and writes need `miniatures:write`. Then take them off the coverage test's pending list, add end-to-end token-scope tests and record the family as declared in the token-scopes doc. All the work is in `backend/`, plus the access-control doc the backend agent already maintains for this epic.

See [backend.md](backend.md) for the full plan.
