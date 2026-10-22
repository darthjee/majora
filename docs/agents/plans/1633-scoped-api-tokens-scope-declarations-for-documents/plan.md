# Plan: Scoped API tokens: scope declarations for documents

Issue: [1633-scoped-api-tokens-scope-declarations-for-documents.md](../../issues/1633-scoped-api-tokens-scope-declarations-for-documents.md)

## Overview
Declare `@token_scopes` on the 18 views of the `documents` family (`games/<slug>/documents…`), remove them from the coverage test's pending list, add end-to-end scoped-token tests, and record the family as declared in the token-scopes doc. Follows the pattern of #1631 (PCs) and #1632 (NPCs).

See [backend.md](backend.md) for the full plan.
