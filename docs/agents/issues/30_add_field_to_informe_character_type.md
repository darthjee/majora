# Add field to informe character type

## Context

Character type (PC vs NPC) is currently determined implicitly by the presence or absence of a `player` association. This implicit logic makes intent unclear and couples PC/NPC status to the player relationship, reducing flexibility.

## What needs to be done

- Backend:
  - Add a boolean field `npc` to the Character model (default `true` — characters default to NPC)
  - Add a migration to introduce the `npc` column with `DEFAULT TRUE`
  - Include a raw SQL data migration to set `npc = false` for all rows where `player_id IS NOT NULL`
  - Update all model scopes and queries that currently distinguish PCs from NPCs to use the new `npc` field instead of checking for a `player_id`

## Acceptance criteria

- [ ] A `npc` boolean column exists on the characters table, defaulting to `true`
- [ ] Existing characters with a `player_id` have `npc = false` after migration
- [ ] All queries/scopes that differentiate PCs from NPCs use the `npc` field
- [ ] Tests cover the new field and updated scopes
