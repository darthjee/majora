# Access Control Reference

This document set is the authoritative reference for data access rules in Majora. Every model,
endpoint, and field is covered, split by resource under `docs/agents/access-control/` so an
agent working on a single resource only needs to load the file(s) relevant to it. When a new
model or endpoint is introduced, update the relevant file (or add a new one) in the same PR.

**Out of scope:** Django admin pages. Superusers always have full access to everything,
regardless of any other rule listed below.

## Contents

### Shared reference

- [User Roles](access-control/user-roles.md) — the role vocabulary (Anonymous, Authenticated,
  GameMaster, Player, Superuser, Staff) used throughout every other file.
- [Common Rules](access-control/common-rules.md) — named permission patterns (GameEdit,
  CharacterEdit, TreasureEdit, ...), the shared `access.json`/`permissions.json` endpoint
  conventions, the cache-bypass mechanism, and the `photo_path` field convention.
- [Permission Principles](access-control/principles.md) — the access-level hierarchy, the
  partial-vs-full route pattern, and the public/regular-vs-hidden attribute pattern, stated once
  and referenced by resource files instead of being re-derived per resource.

### Models / resources

- [Game](access-control/game.md)
- [GamePhoto](access-control/game-photo.md)
- [Upload](access-control/upload.md) — the `Upload` model plus the Game/Character/Treasure photo
  upload init endpoints
- [Character (PC and NPC)](access-control/character.md)
- [GameMaster](access-control/game-master.md)
- [Player](access-control/player.md)
- [User (Staff Management)](access-control/user.md)
- [CharacterPhoto](access-control/character-photo.md)
- [CharacterTreasure](access-control/character-treasure.md)
- [GameTreasure](access-control/game-treasure.md)
- [Link](access-control/link.md)
- [CharacterLink](access-control/character-link.md)
- [Treasure](access-control/treasure.md)
- [GameSession](access-control/game-session.md)
- [GameSessionMessage](access-control/game-session-message.md)
- [Task](access-control/task.md)

### Standalone endpoints

- [Standalone endpoints](access-control/endpoints.md) — access-route config, health check, and
  authentication endpoints.

### Versioning

- [Historical records (`versioning` app)](access-control/versioning.md)

## Adding a new model

When a new model is introduced, add it to this document set in the same PR:

1. List the user roles that can read each field.
2. List the user roles that can create, update, and delete records.
3. Note whether superuser-only access applies and why.
