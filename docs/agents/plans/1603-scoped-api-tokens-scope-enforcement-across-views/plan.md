# Plan: Scoped API tokens: scope enforcement across views

Issue: [1603-scoped-api-tokens-scope-enforcement-across-views.md](../../issues/1603-scoped-api-tokens-scope-enforcement-across-views.md)

## Overview
Build the enforcement core for scoped API tokens: the scope catalogue, the `@token_scopes` decorator,
the real check in `ApiTokenAuthentication`, the exclusion list and the URL-walking coverage test.
Per-family view declarations are out of scope (sub-issues #1630–#1639).

See [backend.md](backend.md) for the full plan.
