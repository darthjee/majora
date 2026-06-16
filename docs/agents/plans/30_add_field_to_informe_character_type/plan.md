# Plan: Add field to informe character type

Issue: [30_add_field_to_informe_character_type.md](../issues/30_add_field_to_informe_character_type.md)

## Branch

`issue-30-add-npc-field`

## Overview

Add an explicit `npc` boolean field to the `Character` model (default `True`) to replace the implicit PC/NPC distinction derived from the presence of a `player` foreign key. A data migration will set `npc = False` for all existing characters with a `player_id`. Views that filter on `player__isnull` will be updated to filter on `npc` instead.

## Agents involved

- [Backend](backend.md)
