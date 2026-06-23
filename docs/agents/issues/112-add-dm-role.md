# Add DM Role

## Context

Currently, a `User` connects to a `PC` (player character) via a `Player` model that tracks the player role. There is no equivalent mechanism for a `User` to be connected to a `Game` as a DM (Dungeon Master). Games have no way to track which users are acting as DM, and since a game can have multiple DMs simultaneously, a simple foreign key on `Game` is insufficient — a joining model is needed.

## What needs to be done

**Backend:**
- Introduce a new model (e.g. `GameMaster`) that links a `Game` to a `User`, analogous to how `Player` links a `PC` to a `User`.
- Add the corresponding database migration.
- Add a serializer for the new model.
- Add views/endpoints and any permissions needed to manage DM assignments (create, list, delete).

## Acceptance criteria

- [ ] A `GameMaster` model exists linking `Game` to `User`.
- [ ] A migration is generated and applied for the new model.
- [ ] Multiple users can be assigned as DM of the same game simultaneously.
- [ ] API endpoints allow creating and removing DM assignments.
- [ ] Appropriate permissions are enforced on DM management endpoints.

---
See issue for details: https://github.com/darthjee/majora/issues/112
