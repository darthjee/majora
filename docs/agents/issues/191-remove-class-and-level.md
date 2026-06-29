# Issue: Remove class and level

## Description
Characters in Majora currently have `character_class` and `level` fields, which imply a class-based RPG progression model. This issue removes those fields and replaces them with a single `role` field — a short free-text description — which better fits the application's actual use cases.

## Problem
The `character_class` and `level` fields add unnecessary complexity and impose a specific RPG structure (class-based leveling) that Majora does not require. They clutter the character model, serializers, and edit forms without providing value.

## Expected Behavior
Characters have a `role` field (CharField, `max_length=200`, nullable/blank) — a short free-text description (e.g. "Village elder", "Court mage", "Spy") that captures the character's narrative function without prescribing a game-mechanical structure. The field is public, exposed in `CharacterDetailSerializer` and `CharacterFullSerializer`, but not in the list endpoint.

## Solution
1. Add a `role` CharField (`max_length=200`, `null=True`, `blank=True`) to the `Character` model.
2. Create a migration that: adds `role`, copies existing `character_class` values into `role`, then drops `character_class` and `level`.
3. Update `CharacterDetailSerializer` and `CharacterFullSerializer` to expose `role` instead of `character_class`/`level`.
4. Update `CharacterUpdateSerializer` to accept `role` as a writable field (removing `character_class` and `level`).
5. Update frontend components (`CharacterInfo`, `CharacterInfoHelper`, `BaseCharacterEditHelper`, `CharacterEdit`, `BaseCharacterEditController`) to use `role`.
6. Update i18n files (`en.yaml`, `pt.yaml`) replacing class/level keys with a `role` key. `CharacterListSerializer` is not changed.

---

Tags: :shipit:
