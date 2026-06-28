# Plan: Add Character Links

Issue: [135-add-character-links.md](../issues/135-add-character-links.md)

## Overview

Add a `CharacterLink` model (FK to `Character`) and a `CharacterLinkSerializer`, embed the serialized links in the existing `CharacterDetailSerializer`, and update `CharacterHelper.jsx` to render the list of links on the character show page. No new endpoint is needed — links are embedded in the existing PC and NPC detail responses.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

The `CharacterDetailSerializer` (used for both `GET /games/<slug>/pcs/<id>.json` and `GET /games/<slug>/npcs/<id>.json`) will include a new `links` field:

```json
"links": [
  { "id": 1, "text": "Official Wiki", "url": "https://example.com/wiki" },
  { "id": 2, "text": "Discord", "url": "https://discord.gg/example" }
]
```

- Field name: `links` (array, may be empty `[]` when the character has none)
- Each element: `{ "id": <integer>, "text": <string>, "url": <string> }`
- The `character` FK is **not** exposed in the serialized output.
- The backend produces this field; the frontend consumes it.
