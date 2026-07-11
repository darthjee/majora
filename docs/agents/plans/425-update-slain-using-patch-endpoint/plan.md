# Plan: Update slain using patch endpoint

Issue: [425-update-slain-using-patch-endpoint.md](../../issues/425-update-slain-using-patch-endpoint.md)

## Overview

Retire the dedicated `PATCH /games/:game_slug/npcs/:id/slain.json` endpoint and fold `slain`/`public_slain`
updates into the general NPC update endpoint (`PATCH /games/:game_slug/npcs/:id.json`), which already enforces
the same permission rule. The backend makes `slain`/`public_slain` writable on `CharacterUpdateSerializer` and
deletes the old view/serializer/url/tests; the frontend switches its slain-toggle client call to the main NPC
endpoint and drops the now-unused client method.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- Request: frontend PATCHes `/games/:game_slug/npcs/:id.json` with a partial body containing exactly one of
  `{"slain": <bool>}` or `{"public_slain": <bool>}` (same shape it already sends today to the slain endpoint).
  The backend already supports partial PATCH (`partial=True` in `detail_or_update`), so no request-shape
  negotiation is needed beyond adding the two fields to `CharacterUpdateSerializer`.
- Response: the response body changes shape — the old endpoint returned `{"slain": ..., "public_slain": ...}`;
  the main endpoint returns the full `CharacterDetailSerializer` payload. This is safe because
  `SlainConfirmController.handleConfirm` (`frontend/assets/js/components/elements/controllers/SlainConfirmController.js`)
  discards the response body and only calls `onSuccess()` — no frontend code reads response fields from this call.
- Removed endpoint: `PATCH /games/:game_slug/npcs/:id/slain.json` (route name `game-npc-slain-set`) is deleted
  entirely by the backend agent; the frontend agent must stop referencing it in the same change so the two
  land together.
