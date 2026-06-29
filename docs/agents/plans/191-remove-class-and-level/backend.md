# Backend Plan: Remove Class and Level

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the API contract consumed by `frontend`:

- Remove `character_class` and `level` from `CharacterDetailSerializer`, `CharacterFullSerializer`, and `CharacterUpdateSerializer`.
- Add `role` (string, nullable) to `CharacterDetailSerializer` and `CharacterFullSerializer` (read-only) and `CharacterUpdateSerializer` (writable).
- The `Character` model gains `role = CharField(max_length=200, null=True, blank=True)` and loses `character_class` and `level`.

## Implementation Steps

### Step 1 — Add `role` field to Character model

In `source/games/models/character.py`:
- Add `role = models.CharField(max_length=200, null=True, blank=True)` after `avatar_url`.
- Remove `character_class = models.CharField(...)` and `level = models.IntegerField(...)`.

### Step 2 — Create migration

Generate the migration with:
```bash
docker-compose run --rm backend python manage.py makemigrations
```

Then edit the generated file to:
1. Add the `role` CharField operation.
2. Add a `RunPython` data migration that copies `character_class` values into `role` for every character that has `character_class` set (and `role` is null).
3. Remove `character_class` AlterField/RemoveField and `level` RemoveField.

Order of operations in the migration:
1. `AddField` — add `role`
2. `RunPython` — copy `character_class` → `role`
3. `RemoveField` — remove `character_class`
4. `RemoveField` — remove `level`

### Step 3 — Update serializers

**`source/games/serializers/character_detail.py`** (`CharacterDetailSerializer`):
- Replace `'character_class'` and `'level'` in `fields` with `'role'`.

**`source/games/serializers/character_full.py`** (`CharacterFullSerializer`):
- No direct change needed — it inherits from `CharacterDetailSerializer`; the parent's `fields` change covers it.

**`source/games/serializers/character_update.py`** (`CharacterUpdateSerializer`):
- Replace `'character_class'` and `'level'` in `fields` with `'role'`.
- Update `extra_kwargs` to reference the new `fields` list.

### Step 4 — Update tests

**`source/games/tests/models/test_character.py`**:
- Replace any references to `character_class` and `level` with `role`.
- Update `test_character_optional_fields` (and any similar test) to use `role`.

**`source/games/tests/serializers/test_character_detail.py`**:
- Replace `character_class='Hobbit'` and `level=5` fixture data with `role='Hobbit'`.
- Remove `test_serializes_character_class` and `test_serializes_level`.
- Add `test_serializes_role`.

**`source/games/tests/serializers/test_character_full.py`**:
- Same pattern as above.

**`source/games/tests/serializers/test_character_update.py`**:
- Replace `character_class` and `level` field references with `role`.

**`source/games/tests/views/characters_test.py`**:
- Replace any `character_class` / `level` references with `role`.

### Step 5 — Run checks locally

```bash
docker-compose run --rm backend pytest source/
docker-compose run --rm backend ruff check source/
docker-compose run --rm backend ruff format --check source/
```

Fix any failures before committing.

### Step 6 — Commit

```bash
scripts/commit_change.sh "feat(backend): replace character_class/level with role field (issue #191)" "claude-sonnet-4-6" "claude-sonnet-4-6@anthropic.com"
```

> Resolve `commit_change.sh` relative to the `auto-fix-issue` skill folder.

## Files to Change

- `source/games/models/character.py` — add `role`, remove `character_class` and `level`
- `source/games/migrations/<next>.py` — new migration with data copy
- `source/games/serializers/character_detail.py` — swap fields
- `source/games/serializers/character_update.py` — swap fields
- `source/games/tests/models/test_character.py` — update test fixtures and assertions
- `source/games/tests/serializers/test_character_detail.py` — update fixtures and tests
- `source/games/tests/serializers/test_character_full.py` — update fixtures and tests
- `source/games/tests/serializers/test_character_update.py` — update fixtures and tests
- `source/games/tests/views/characters_test.py` — update references

## CI Checks

- `source/`: `docker-compose run --rm backend pytest source/` (CI job: `backend-tests`)
- `source/`: `docker-compose run --rm backend ruff check source/` (CI job: `backend-lint`)

## Notes

- `character_full.py` does not need direct field changes — it inherits from `CharacterDetailSerializer`.
- The data migration copies `character_class` into `role` only where `role` is null; this is safe for a fresh DB where all `role` values are null.
- `CharacterListSerializer` must NOT be changed.
