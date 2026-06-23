# Plan: Add Access to Dungeon Master

Issue: [116-add-access-to-dungeon-master.md](../issues/116-add-access-to-dungeon-master.md)

## Overview

Extend `Character.can_be_edited_by` to grant edit access to users who are `GameMaster`s of the character's game, and introduce a `Character.editors` property that returns the queryset of users with explicit edit rights (player's user + all DMs). No migration, no new model, no frontend or infrastructure changes.

## Context

`Character.can_be_edited_by` currently allows editing only if the user is the character's linked player or a superuser. Issue #112 introduced the `GameMaster` model; this issue wires it into the authorization check so DMs can also edit all characters in their games. The issue also asks for an `editors` interface listing explicit editors (excluding implicit superuser access).

## Implementation Steps

### Step 1 — Add the `editors` property to `Character`

In `source/games/models.py`, add a `editors` property to the `Character` model that returns a `User` queryset covering:
- The character's player's user (if the character has a player and that player has a linked user).
- All users who are `GameMaster`s of the character's game.

```python
@property
def editors(self):
    from django.db.models import Q
    dm_ids = self.game.game_masters.values_list('user_id', flat=True)
    q = Q(id__in=dm_ids)
    if self.player_id is not None and self.player.user_id is not None:
        q |= Q(id=self.player.user_id)
    return User.objects.filter(q)
```

Superusers are intentionally excluded — their access is implicit and always checked separately.

### Step 2 — Update `can_be_edited_by` to use `editors`

Replace the final return line of `can_be_edited_by` with a check against `editors`:

```python
def can_be_edited_by(self, user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return self.editors.filter(id=user.id).exists()
```

This keeps the superuser fast-path, avoids loading full objects, and centralises "who can edit" in `editors`.

### Step 3 — Update existing tests

In `source/games/tests/models_test.py`, the existing test `test_can_be_edited_by_returns_false_when_no_player` still passes as-is (a character with no player and no DMs cannot be edited). No existing tests break; verify by running the suite.

### Step 4 — Add new tests for DM access

In `source/games/tests/models_test.py`, add to `TestCharacter`:

- `test_can_be_edited_by_returns_true_for_game_master` — a user who is a `GameMaster` of the character's game can edit the character.
- `test_can_be_edited_by_returns_false_for_dm_of_different_game` — a user who is a `GameMaster` of a *different* game cannot edit the character.
- `test_editors_includes_player_user` — `editors` queryset contains the player's linked user.
- `test_editors_includes_game_masters` — `editors` queryset contains all DM users of the game.
- `test_editors_excludes_unrelated_users` — `editors` does not include users with no relationship to the character.
- `test_editors_is_empty_when_no_player_and_no_dms` — `editors` is empty for a character with no player and no DMs.

## Files to Change

- `source/games/models.py` — add `editors` property; update `can_be_edited_by`
- `source/games/tests/models_test.py` — add new `TestCharacter` tests for DM access and `editors`

## CI Checks

- `source/`: `docker-compose run --rm majora_tests poetry run pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- `editors` returns a queryset, so callers can chain further filters (e.g. `.filter(id=user.id).exists()`), which avoids loading all editor objects into memory.
- The `Q(id__in=dm_ids)` subquery always runs even when the character has no DMs; Django optimises this to an empty `IN ()` when there are no results.
- No migration is needed — this is purely model-level logic on existing tables.
