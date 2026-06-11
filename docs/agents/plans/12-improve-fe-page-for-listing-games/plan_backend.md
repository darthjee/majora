# Plan: Backend — Add Image Field to Game

## Overview

Add a `photo` URL field to the `Game` model so each game can have a cover image. Expose the field
in the games list serializer so the frontend card can display it.

## Context

The current `Game` model has `name` and `game_slug`. The existing `Photo` model is tied to
`Character`, not `Game`. The simplest approach is to add a nullable `photo` URL field directly
to `Game` — no new model needed.

## Implementation Steps

### Step 1 — Add `photo` field to the Game model

In `source/games/models.py`, add a `URLField` (nullable, blank allowed) to the `Game` model:

```python
photo = models.URLField(null=True, blank=True)
```

### Step 2 — Create and run the migration

Generate the migration with:

```bash
python manage.py makemigrations games
```

The migration should add a single nullable column with no default — safe for existing rows.

### Step 3 — Expose `photo` in the list serializer

In `source/games/serializers.py`, add `photo` to the fields of the game list serializer
(the one used by `GET /games.json`). The detail serializer should also include it for consistency.

### Step 4 — Register in Django Admin

In `source/games/admin.py`, add `photo` to the `fields` or `fieldsets` of `GameAdmin` so it can
be set through the admin panel.

### Step 5 — Update backend tests

In `source/games/tests/`, update or add test cases to:
- Assert `photo` appears in the list API response (both `null` and with a URL value)
- Assert the field is optional (a game without a photo is still valid)

## Files to Change

- `source/games/models.py` — add `photo = models.URLField(null=True, blank=True)` to `Game`
- `source/games/migrations/` — new auto-generated migration file
- `source/games/serializers.py` — add `photo` to game list and detail serializers
- `source/games/admin.py` — expose `photo` in the admin form
- `source/games/tests/` — update API response assertions

## Notes

- Storing a URL (not a file upload) keeps the change simple and defers file hosting to a later
  issue if needed.
- The field is nullable so all existing games remain valid without requiring a data migration.
