# Issue: Add a can_exchange_document permission flag to gate the character Documents exchange button

## Description
Found while enhancing #1443 (recipes API contract), which introduced a `can_exchange_recipe` flag (landed in #1459 backend / #1450 frontend) to gate the character recipe acquire/remove UI. `CharacterDocument` has no equivalent flag, so the character Documents page always offers the "Exchange" action, regardless of who is viewing it.

## Problem
The "Exchange" trigger on the character Documents page
(`frontend/assets/js/components/resources/character/pages/shared/CharacterDocuments.jsx`, rendered through `CharacterDocumentsHelper.render`'s `onExchangeDocuments` argument) is **always** shown — including to anonymous visitors and to users who are not part of the game. Clicking through leads to `documents/acquire.json` / `documents/remove.json` calls that the backend rejects with 403.

## Expected Behavior
- A user who cannot acquire/remove documents for a character (anonymous, not in the game, or role-simulating such a user) no longer sees the Documents "Exchange" button.
- Staff, players, dm and admin still see it and can use it.
- Both PC and NPC Documents pages behave the same way.

## Solution
Mirror the `can_exchange_recipe` implementation from #1459 / #1450.

**Backend** (config-driven — no view code expected):
- Add `backend/permissions/config/game_pc_document/ui.yml` and `game_npc_document/ui.yml` with an `exchange` action listing `staff` and `player`, with a header comment stating it must mirror that resource's `endpoints.yml` `regular.create` (and add the reciprocal comment to both `endpoints.yml` files).
- Map `exchange: can_exchange_document` under `game_pc_document` / `game_npc_document` in `backend/permissions/config/pages/character_pc.yml` / `character_npc.yml`, so the flag is returned by `GET /permissions/game_pc.json` and `GET /permissions/game_npc.json`. dm/admin always pass, and the real-identity vs. role-simulated dual path is inherited from the shared permissions builder.
- Tests: extend `game_pc_permissions_test.py` / `game_npc_permissions_test.py`, `permissions/tests/page_config_store_test.py` and `builder_test.py` as was done for `can_exchange_recipe`.

**Frontend**:
- Surface `can_exchange_document` through `CharacterAccessResolver.js`, `AccessStorePermissions.js` (JSDoc) and `RequestPermissionResolvers.js`, with specs, following the `can_exchange_recipe` wiring.
- In `CharacterDocuments.jsx`, pass the exchange handler to `CharacterDocumentsHelper.render` only when `character.can_exchange_document` is true (the helper already skips the button when `onExchangeDocuments` is null), mirroring `CharacterRecipes.jsx`'s `resolveRecipeExchangeButton`. Update specs accordingly.

**Docs**:
- Document the flag in `docs/agents/access-control/character.md` and `docs/agents/access-control/character-document.md`.

**Out of scope**: backend authorization of the acquire/remove endpoints themselves (already enforced); other character resources' exchange buttons.

## Benefits
- Users no longer see an action that can only fail with a 403.
- Character resource exchange flags become consistent (`can_exchange_treasure`, `can_exchange_recipe`, `can_exchange_document`).
- The UI and backend role lists are tied together by the ui.yml ↔ endpoints.yml mirroring convention.
