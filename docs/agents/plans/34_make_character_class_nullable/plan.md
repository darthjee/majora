# Plan: Make character class nullable

Issue: [34_make_character_class_nullable.md](../issues/34_make_character_class_nullable.md)

## Branch

`issue-34-nullable-character-class`

## Overview

Add `null=True` to the `character_class` field on the `Character` model so NPCs can be stored without a class. A migration is required. The serializer already exposes the field and will return `null` naturally. The frontend already guards against null via `if (!character_class) return null` in `CharacterInfoHelper`. Only backend changes are needed.

## Agents involved

- [Backend](backend.md)
