# Plan: Add photos to game

Issue: [153-add-photos-to-game.md](../issues/153-add-photos-to-game.md)

## Overview

Add a `GamePhoto` model (FK to `Game`) to support multiple photos per game, mirroring the existing `Photo` model for characters. The game detail serializer exposes the new `photos` field, and the game detail page in the frontend renders the photo gallery using the existing `CharacterPhotos` component.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `GET /games/<slug>.json` — game detail response

The `GameDetailSerializer` will include a new `photos` field alongside the existing fields.

Shape (unchanged fields omitted for clarity):

```json
{
  "name": "...",
  "game_slug": "...",
  "photo": "...",
  "description": "...",
  "links": [...],
  "photos": [
    { "id": 1, "url": "https://example.com/img1.jpg" },
    { "id": 2, "url": "https://example.com/img2.jpg" }
  ]
}
```

- `photos` is always present (empty array when no photos exist).
- Each item has `id` (integer) and `url` (string).
- Field name: `photos` (matches the `related_name` on `GamePhoto.game`).
