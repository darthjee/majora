# Plan: Improve Treasure Exchange Modal (Search, Sorting, Money Display, Button Rename)

Issue: [449-modify-car-cter-treasure-modification-modal.md](../../issues/449-modify-car-cter-treasure-modification-modal.md)

## Overview

Improve the existing acquire/sell modal on `/#/games/:game_slug/pcs/:id/treasures`
(`TreasureExchangeModal.jsx`) without changing its core acquire/sell logic: rename its
trigger button, add a live name search to both tabs, reverse the acquire tab's default sort,
and show the character's money at the top of the modal, kept fresh via a real refetch after
each exchange (instead of the local patch it does today). The two treasure-list endpoints
(`GET /games/<game_slug>/treasures.json` and `GET /games/<game_slug>/pcs/<id>/treasures.json`)
gain a `search` query param, and the game-treasures endpoint additionally gains an `ordering`
param — a param is needed instead of just flipping the hardcoded default because that same
endpoint also backs the unrelated, ascending-order "Game Treasures" management page
(`GameTreasuresController.js`), which must keep its current order.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `GET /games/<game_slug>/treasures.json` (acquire list — `backend/games/views/games/game_treasures.py`)
- New query param `search` (optional): case-insensitive substring match on `Treasure.name`
  (`name__icontains`), combined (AND) with the existing `max_value` filter.
- New query param `ordering` (optional, default `asc`): `asc` keeps today's
  `order_by('value', 'id')`; `desc` uses `order_by('-value', 'id')`. Any other/missing value
  falls back to `asc`, matching `_filter_by_max_value`'s tolerant-parsing style. Existing
  callers that don't pass `ordering` (e.g. `GameTreasuresController.js`) are unaffected.
- Response shape (`TreasureListSerializer`) is unchanged.

### `GET /games/<game_slug>/pcs/<id>/treasures.json` / `.../npcs/<id>/treasures.json` (sell list — `backend/games/views/game/_treasures.py`)
- New query param `search` (optional): case-insensitive substring match on the related
  `Treasure.name` (`treasure__name__icontains`).
- Ordering (`treasure__value`, `treasure__id`) is unchanged — the issue only asks to reverse
  the acquire tab.
- Response shape (`CharacterTreasureSerializer`) is unchanged.

### Character money (already-available data, no new endpoint)
- `GET /games/<game_slug>/pcs/<id>.json` (`CharacterDetailSerializer`, already fetched once per
  page load by `BaseCharacterTreasuresController`) already returns `money`. Frontend reuses this
  — no backend change needed here. `frontend`'s job is to (a) render it via the existing
  `TreasureMoney` component (already produces a full denomination breakdown string) at the top
  of the modal, and (b) re-run that same fetch after every successful exchange instead of
  locally patching `character.money` from the exchange response.

## Out of scope
- Any change to the sell tab's sort order.
- Any UI control to toggle sort direction — the acquire tab is always descending; `ordering` is
  purely a backend switch to avoid regressing the unrelated Game Treasures page.
