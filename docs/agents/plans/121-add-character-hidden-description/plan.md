# Plan: Add Character Hidden Description

Issue: [121-add-character-hidden-description.md](../issues/121-add-character-hidden-description.md)

## Overview

Add a `private_description` field to the `Character` model alongside the existing `description` (renamed to `public_description`). A new `/full` endpoint exposes both fields but only to users with edit access (DM or character owner for PCs; DM-only for NPCs). The existing PATCH endpoint also accepts `private_description` under the same permission gate. The frontend gains a "full" detail view that shows private notes to authorised users, and the Navi cache warmer is updated to pre-fetch the new endpoints.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [infra](infra.md)
- [translator](translator.md)

## Shared contracts

### New API endpoints

| Method | URL | Access |
|--------|-----|--------|
| `GET` | `/games/<slug>/pcs/<id>/full.json` | DM or PC's own player (or superuser) |
| `GET` | `/games/<slug>/npcs/<id>/full.json` | DM (or superuser) |

Both return the same shape as the existing detail endpoint **plus** the `private_description` field:

```json
{
  "id": 1,
  "name": "Aragorn",
  "avatar_url": null,
  "character_class": "Ranger",
  "level": 10,
  "public_description": "A ranger from the north.",
  "private_description": "Actually the heir to the throne of Gondor.",
  "is_pc": true,
  "photos": [],
  "game_slug": "lotr",
  "can_edit": true
}
```

### Renamed field

The existing `description` field is renamed to `public_description` in the database (via migration) and in all serializers. The frontend must use `public_description` in place of `description` everywhere the character detail response is consumed.

### PATCH payload

`private_description` is accepted by the existing PATCH endpoint (`/games/<slug>/pcs/<id>.json` and `/games/<slug>/npcs/<id>.json`) under the same edit-access gate as the other fields.

### New translation keys

```yaml
character_full_page:
  loading: "Loading character..."  # reuses character_page.loading semantics
  private_description_label: "DM Notes"
```
Both `en.yaml` and `pt.yaml` must define these keys.
