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
- [Permission Principles](access-control/principles.md) — the access-level hierarchy, resource
  categories (game/staff/account/sensitive-information), endpoint/role scope, the `X-Skip-Cache`
  rule, the filter-visibility rule, list/show serializer defaults, the partial-vs-full route
  pattern, the default resource CRUD pattern, the default hidden-gated collection pattern, and the
  field-naming conventions (`public_x`, `id`/`<related>_id`, `hidden`, `incognito`), stated once
  and referenced by resource files instead of being re-derived per resource. Check here before
  diving into a per-resource file below — a resource file states only its endpoints, roles, and
  deviations from these conventions, trusting the code for serializer/permission-class names and
  file paths.

### Models / resources

- [Game](access-control/game.md)
- [GamePhoto](access-control/game-photo.md)
- [Upload](access-control/upload.md) — the `Upload` model plus the Game/Character/Treasure/
  GameDocument photo and file upload init endpoints
- [Character (PC and NPC)](access-control/character.md) — permission classes per action for PCs
  and NPCs, regular vs restricted (`full.json`/`all.json`) routes, filters, exposed fields, and the
  narrow player-facing PATCH/create field sets.
- [Player](access-control/player.md) — includes the DM/GameMaster role (`Player.is_dm`)
- [User (Staff Management)](access-control/user.md)
- [Staff Cache](access-control/staff-cache.md) — the staff-only memory-cache management endpoints
- [CharacterPhoto](access-control/character-photo.md)
- [CharacterTreasure](access-control/character-treasure.md)
- [GameTreasure](access-control/game-treasure.md)
- [GameItem](access-control/game-item.md)
- [GameFaction](access-control/faction.md)
- [CharacterFaction](access-control/character-faction.md)
- [GamePossession](access-control/game-possession.md)
- [CharacterPossession](access-control/character-possession.md)
- [GameCommonItem](access-control/game-common-item.md)
- [CharacterItem](access-control/character-item.md)
- [GameDocument](access-control/game-document.md)
- [CharacterDocument](access-control/character-document.md)
- [Link](access-control/link.md)
- [CharacterLink](access-control/character-link.md)
- [Treasure](access-control/treasure.md)
- [GameSession](access-control/game-session.md)
- [GameSessionMessage](access-control/game-session-message.md)
- [Task](access-control/task.md)
- [Poll](access-control/poll.md)
- [Conversation](access-control/conversation.md) — `Conversation`, `ConversationParticipant`,
  `Message`, `MessageVisualisation` (`conversations` app); exposed via `Game`'s
  `GET /my-games.json` (aggregate counts) and `GET /games/:game_slug/conversations.json`
  (id/title list)
- [StlModel](access-control/stl-model.md) — `StlModel`, `StlModelLink`, `StlModelPhoto`,
  `Tag` (`miniatures` app); a cross-domain, login-only STL/miniature catalog
- [Source](access-control/source.md) — `Source`, `SourcePhoto` (`miniatures` app); a cross-domain,
  login-only catalog of STL sites/publishers
- [Collection](access-control/collection.md) — `Collection`, `CollectionPhoto` (`miniatures` app);
  a cross-domain, login-only grouping of related `StlModel`s, optionally attributed to a `Source`

### Standalone endpoints

- [Standalone endpoints](access-control/endpoints.md) — access-route config, health check,
  authentication endpoints, and the `AuthorizationRequest` device-authorize login endpoints.

### Versioning

- [Historical records (`versioning` app)](access-control/versioning.md)

## Adding a new model

When a new model is introduced, add it to this document set in the same PR:

1. List the user roles that can read each field.
2. List the user roles that can create, update, and delete records.
3. Note whether superuser-only access applies and why.
