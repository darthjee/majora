# Add More Information on Access Endpoints

## Context

The three access endpoints currently return only a single boolean field `can_edit`, which makes it difficult to debug why access is denied. When `can_edit` is `false`, there is no contextual information to determine whether the user is unauthenticated, lacks superuser privileges, or is not a DM/owner of the relevant game or character.

Endpoints affected:
- `GET /games/:game_slug/access.json`
- `GET /games/:game_slug/pc/:character_id/access.json`
- `GET /games/:game_slug/npc/:character_id/access.json`

## What needs to be done

Extend each access endpoint response with additional diagnostic fields. All fields return `null` when the request is anonymous (no auth token).

**Backend:** Update the serializers for all three access endpoints to include the new fields:

- `GET /games/:game_slug/access.json` — add:
  - `username` — the requesting user's username (`null` if anonymous)
  - `is_superuser` — whether the user is a site superuser (`null` if anonymous)
  - `is_dm` — whether the user is a GameMaster of this game (`null` if anonymous)

- `GET /games/:game_slug/pc/:character_id/access.json` — add:
  - `username` — the requesting user's username (`null` if anonymous)
  - `is_superuser` — whether the user is a site superuser (`null` if anonymous)
  - `is_dm` — whether the user is a GameMaster of this game (`null` if anonymous)
  - `is_owner` — whether the requesting user is the Player who owns this character (`null` if anonymous)

- `GET /games/:game_slug/npc/:character_id/access.json` — add:
  - `username` — the requesting user's username (`null` if anonymous)
  - `is_superuser` — whether the user is a site superuser (`null` if anonymous)
  - `is_dm` — whether the user is a GameMaster of this game (`null` if anonymous)

**Frontend:** Update any components that display or consume access endpoint responses to handle and optionally display the new fields.

## Acceptance criteria

- [ ] `GET /games/:game_slug/access.json` returns `username`, `is_superuser`, and `is_dm` fields
- [ ] `GET /games/:game_slug/pc/:character_id/access.json` returns `username`, `is_superuser`, `is_dm`, and `is_owner` fields
- [ ] `GET /games/:game_slug/npc/:character_id/access.json` returns `username`, `is_superuser`, and `is_dm` fields
- [ ] All new fields return `null` when the request is unauthenticated (anonymous)
- [ ] All new fields return appropriate values when the request is authenticated
- [ ] Existing `can_edit` field behavior is unchanged
- [ ] Backend tests cover the new fields for all three endpoints (authenticated and unauthenticated)
