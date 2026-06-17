# Add game_slug to characters response

## Context

The JSON responses for characters (PCs, NPCs, and individual character endpoints) don't include `game_slug`, even though a character always belongs to the game identified by that slug in the request path. Frontend code that needs to link back to a character's game currently has to separately pass or infer the slug.

## What needs to be done

- Backend:
  - Add a `game_slug` field (sourced from `character.game.game_slug`) to `CharacterListSerializer` (used by `GET /games/:game_slug/pcs.json` and `npcs.json`) and to `CharacterDetailSerializer` (used by `GET /games/:game_slug/pcs/:id.json` and `npcs/:id.json`).
  - Update affected tests in `source/games/tests/serializers_test.py` and `source/games/tests/views_test.py` to assert `game_slug` is present in the response.

## Acceptance criteria

- [ ] `GET /games/:game_slug/pcs.json` and `npcs.json` include `game_slug` for each character
- [ ] `GET /games/:game_slug/pcs/:id.json` and `npcs/:id.json` include `game_slug` for the character
- [ ] Existing serializer/view tests are updated and pass
