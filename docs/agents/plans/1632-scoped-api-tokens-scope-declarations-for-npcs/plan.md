# Plan: Scoped API tokens: scope declarations for NPCs

Issue: [1632-scoped-api-tokens-scope-declarations-for-npcs.md](../../issues/1632-scoped-api-tokens-scope-declarations-for-npcs.md)

## Overview
Declare `@token_scopes` on every NPC view (core, nested, photos and the reverse-nested NPC summaries), remove those views from the coverage test's pending list, add end-to-end token-scope tests, and update the Status paragraph of `token-scopes.md`. This mirrors #1631 (squash commit `386f3465`), so the work belongs to the backend agent alone.

See [backend.md](backend.md) for the full plan.
