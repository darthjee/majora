# Make character class nullable

## Context

The `character_class` field is currently mandatory for all characters, including NPCs (non-player characters) where a class may not apply. This makes it impossible to create NPC characters without a class and can cause display issues on pages that assume the field is always present.

## What needs to be done

- **Backend:** Make `character_class` nullable and blank-allowed in the model, create a migration, and update serializers to handle `null` gracefully.
- **Frontend:** Update character listing and detail components to render without errors when `character_class` is `null` or absent.

## Acceptance criteria

- [ ] `character_class` field on the `Character` model is nullable (`null=True, blank=True`)
- [ ] Migration exists for the schema change
- [ ] Serializers return `null` (not an error) when `character_class` is absent
- [ ] Frontend character list and detail views handle a `null` class without breaking
- [ ] NPC characters can be created and saved without a character class
- [ ] All tests pass
