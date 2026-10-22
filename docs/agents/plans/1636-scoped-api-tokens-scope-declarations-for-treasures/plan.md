# Plan: Scoped API tokens: scope declarations for treasures

Issue: [1636-scoped-api-tokens-scope-declarations-for-treasures.md](../../issues/1636-scoped-api-tokens-scope-declarations-for-treasures.md)

## Overview
Declare `@token_scopes` on the 12 pending `treasures` family views: game-scoped treasure routes, top-level catalogue routes and the two treasure permission reports. Add an in-view game-list check where a top-level route acts on a game-exclusive treasure, remove the views from the coverage test's pending set, add end-to-end token tests and document the declarations. All work is in `backend/` (plus the access-control doc), so it is a single-owner plan.

See [backend.md](backend.md) for the full plan.
