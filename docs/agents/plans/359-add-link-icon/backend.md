# Backend Plan: Add link icon

Main plan: [plan.md](plan.md)

## Shared contracts

- Add a `link_type` `CharField` to both `Link` (`source/games/models/link.py`) and `CharacterLink` (`source/games/models/character_link.py`).
- Follow the existing constants + `CHOICES` list convention (see `Upload.STATUS_CHOICES` in `source/games/models/upload.py`), not `models.TextChoices`. Name the field `link_type` (avoiding the `type` builtin, per the issue).
- Starting choice: `LINK_TYPE_LOOTSTUDIO = 'lootstudio'`, with `LINK_TYPE_CHOICES = [(LINK_TYPE_LOOTSTUDIO, 'LootStudio')]`.
- Field must be optional (`blank=True`, sensible `default=''` or `null=True` — match how other optional `CharField`s in this codebase are declared, e.g. check `Character.character_class`/`description` style) so existing links without a type keep working.
- Expose `link_type` on both `LinkSerializer` (`source/games/serializers/link.py`) and `CharacterLinkSerializer` (`source/games/serializers/character_link.py`) by adding it to their `fields` list — no other serializer logic changes.

## Implementation Steps

### Step 1 — Add `link_type` to the `Link` model
Edit `source/games/models/link.py`: add module-level constants (`LINK_TYPE_LOOTSTUDIO = 'lootstudio'`), a `LINK_TYPE_CHOICES` list, and the `link_type` `CharField` (with `max_length` sized to the longest constant plus headroom, `choices=LINK_TYPE_CHOICES`, `blank=True`, `default=''`).

### Step 2 — Add `link_type` to the `CharacterLink` model
Mirror Step 1 in `source/games/models/character_link.py`. Since both models need the identical constant set, define the constants/choices once per file (no shared base model exists today) unless a natural extraction point is found while implementing — keep it simple and consistent with the existing duplication pattern already present between `Link` and `CharacterLink` (both already duplicate `text`/`url`).

### Step 3 — Generate migrations
Run (via docker-compose, never directly):
```bash
docker-compose run --rm majora_tests python manage.py makemigrations games
```
This should produce two `AddField` migrations (or one combined migration) for `link_type` on `Link` and `CharacterLink`. Review the generated migration file(s) for correctness before committing.

### Step 4 — Update serializers
Add `'link_type'` to the `fields` list in both `source/games/serializers/link.py` and `source/games/serializers/character_link.py`.

### Step 5 — Tests
- `source/games/tests/models/test_link.py` / `test_character_link.py`: add coverage for creating a link with `link_type` set (e.g. `'lootstudio'`) and confirm the default/blank case still works.
- `source/games/tests/serializers/test_link.py` / `test_character_link.py`: assert `link_type` is present in serialized output, including when unset (should serialize as an empty string, not omitted).

## Files to Change
- `source/games/models/link.py` — add `link_type` field + constants/choices
- `source/games/models/character_link.py` — add `link_type` field + constants/choices
- `source/games/migrations/00XX_*.py` — new migration(s) for both fields
- `source/games/serializers/link.py` — add `link_type` to `fields`
- `source/games/serializers/character_link.py` — add `link_type` to `fields`
- `source/games/tests/models/test_link.py` — add `link_type` coverage
- `source/games/tests/models/test_character_link.py` — add `link_type` coverage
- `source/games/tests/serializers/test_link.py` — add `link_type` coverage
- `source/games/tests/serializers/test_character_link.py` — add `link_type` coverage

## CI Checks
- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all` / `pytest_views_rest`)
- `source/`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes
- No new API endpoint is added, so no Navi warm-up config changes are needed — `link_type` just rides along on the existing `links` arrays already returned by `/games/<slug>.json` and the character detail endpoints.
- Double-check the `data-access` review after this change, since it touches serializer fields (even though `link_type` is not sensitive data).
