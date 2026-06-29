# Plan: Remove Class and Level

Issue: [191-remove-class-and-level.md](../issues/191-remove-class-and-level.md)

## Overview

Remove `character_class` and `level` from the `Character` model, serializers, and frontend, replacing them with a single `role` CharField (`max_length=200`, nullable/blank). The migration will preserve existing `character_class` values by copying them into `role` before dropping the old columns. All three layers (backend, frontend, translations) change in parallel.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API field change

The following change applies to the character detail and full endpoints:

**Removed fields:**
- `character_class` (string, nullable)
- `level` (number, nullable)

**Added field:**
- `role` (string, nullable) — short free-text description of the character's narrative function

Affected endpoints:
- `GET /games/<slug>/pcs/<id>.json`
- `GET /games/<slug>/npcs/<id>.json`

`CharacterDetailSerializer` and `CharacterFullSerializer` expose `role` (read-only).
`CharacterUpdateSerializer` accepts `role` as a writable field (removing `character_class` and `level`).
`CharacterListSerializer` is NOT changed.

### i18n key change

**Removed keys** (in both `en.yaml` and `pt.yaml`):

```yaml
character_info:
  class_label: ...
  level_label: ...

pc_edit_page:
  character_class_label: ...
  level_label: ...

npc_edit_page:
  character_class_label: ...
  level_label: ...
```

**Added keys:**

```yaml
character_info:
  role_label: 'Role:'   # en  /  'Função:' in pt

pc_edit_page:
  role_label: Role      # en  /  'Função' in pt

npc_edit_page:
  role_label: Role      # en  /  'Função' in pt
```
