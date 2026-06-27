# Add photos to game

## Context

Games currently support only a single photo URL field (`Game.photo`). Characters already have a proper photo gallery via the `Photo` model (a `ForeignKey` to `Character` with a `photos` related name). This inconsistency means it is impossible to attach more than one image to a game, limiting game presentation compared to characters.

## What needs to be done

**Backend:**
- Add multi-photo support to `Game` by either introducing a new `GamePhoto` model (mirroring `Photo` but with a `ForeignKey` to `Game`) or by refactoring the existing `Photo` model to support both characters and games (e.g. making `character` nullable and adding an optional `game` FK).
- Create the necessary migration(s).
- Expose the game's photo gallery via the existing game detail serializer (and/or a dedicated serializer).
- Write model and serializer tests.

**Frontend:**
- Display the game's photo gallery on the game detail page, analogous to how character photos are shown.
- Add frontend specs.

**Docs:**
- Update `docs/agents/architecture.md` if the domain model changes.

## Acceptance criteria

- [ ] A game can have zero or more photos stored in the database.
- [ ] The game detail API endpoint (`/games/<slug>.json`) returns the list of photos for that game.
- [ ] The game detail page in the frontend renders all game photos.
- [ ] Backend tests cover the new model, serializer, and endpoint behavior.
- [ ] Frontend specs cover the photo gallery rendering.

Tags: :eyes:
