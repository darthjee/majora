# Plan: Add Game Treasures Page

Issue: [170-add-game-treasures-page.md](../issues/170-add-game-treasures-page.md)

## Overview

Add a read-only treasures list page at `#/games/:game_slug/treasures` that shows the treasures associated with a specific game. This requires adding a M2M relationship between `Game` and `Treasure` in the backend (with a new `GET /games/<slug>/treasures.json` endpoint), a new `GameTreasures` page in the frontend (following the GamePcs/GameNpcs pattern), and a link from the game show page. The Navi cache warmer must also be updated to include the new endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [infra](infra.md)

## Shared contracts

### Endpoint

`GET /games/<slug>/treasures.json`

- **Auth**: public (AllowAny), consistent with existing game character list endpoints
- **Response**: paginated JSON array
- **Item shape**:
  ```json
  { "id": 1, "name": "Golden Ring", "value": 500 }
  ```
- **Pagination headers**: `page`, `pages`, `per_page`, `total` (same as existing list endpoints)
- **404**: returned when `game_slug` does not match any game

### Frontend route

`/games/:game_slug/treasures` → page key `gameTreasures`
