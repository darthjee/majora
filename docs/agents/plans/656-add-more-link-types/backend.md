# Backend Plan: Add more link types

Main plan: [plan.md](plan.md)

## Shared contracts

Add these five values, in this order, to `LINK_TYPE_CHOICES` on both `Link` and `CharacterLink`, after the existing `lootstudio` entry:

| value | label |
| --- | --- |
| `diary` | `Diary` |
| `music` | `Music` |
| `stl` | `STL` |
| `background` | `Background` |
| `reference` | `Reference` |

Frontend and translator rely on these exact value strings (`diary`, `music`, `stl`, `background`, `reference`) matching what they wire into the dropdown and translation keys — do not rename them.

## Implementation Steps

### Step 1 — Extend `Link.LINK_TYPE_CHOICES`

In `backend/games/models/link.py`, add a `LINK_TYPE_<X>` constant and a matching choice tuple for each of the five new types, following the existing `LINK_TYPE_LOOTSTUDIO` pattern:

```python
LINK_TYPE_LOOTSTUDIO = 'lootstudio'
LINK_TYPE_DIARY = 'diary'
LINK_TYPE_MUSIC = 'music'
LINK_TYPE_STL = 'stl'
LINK_TYPE_BACKGROUND = 'background'
LINK_TYPE_REFERENCE = 'reference'

LINK_TYPE_CHOICES = [
    (LINK_TYPE_LOOTSTUDIO, 'LootStudio'),
    (LINK_TYPE_DIARY, 'Diary'),
    (LINK_TYPE_MUSIC, 'Music'),
    (LINK_TYPE_STL, 'STL'),
    (LINK_TYPE_BACKGROUND, 'Background'),
    (LINK_TYPE_REFERENCE, 'Reference'),
]
```

### Step 2 — Extend `CharacterLink.LINK_TYPE_CHOICES`

Apply the identical change to `backend/games/models/character/character_link.py` (it duplicates the same constants/choices independently — keep both in sync).

### Step 3 — Migration

Generate a new migration (e.g. `backend/games/migrations/0063_alter_characterlink_link_type_alter_link_link_type.py`, next number after `0062_backfill_userprofile_display_name.py`) with two `AlterField` operations updating the `choices` list on `characterlink.link_type` and `link.link_type` to the full six-entry list, mirroring the shape of `0039_characterlink_link_type_link_link_type.py`. Prefer running `poetry run python manage.py makemigrations` from `backend/` to generate it rather than hand-writing, then review the output matches the expected choices.

### Step 4 — Tests

In `backend/games/tests/models/link_test.py`, extend `test_link_creation_with_link_type` (or add sibling tests) to cover at least one of the new types, asserting the stored value — same shape as the existing `LINK_TYPE_LOOTSTUDIO` test. Apply the same to `backend/games/tests/models/character/character_link_test.py` for `CharacterLink`.

No serializer changes are needed — `LinkSerializer` and the `CharacterLink` serializers pass `link_type` through as a plain field; choice validation happens at the model level.

## Files to Change

- `backend/games/models/link.py` — add 5 new `LINK_TYPE_*` constants and choices.
- `backend/games/models/character/character_link.py` — same, duplicated.
- `backend/games/migrations/0063_*.py` — new migration altering both `link_type` fields' choices.
- `backend/games/tests/models/link_test.py` — extend/add coverage for new types.
- `backend/games/tests/models/character/character_link_test.py` — extend/add coverage for new types.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- No API/serializer changes, no new endpoints, no access-control impact — `data-access`/`security`/`product-owner` review is not needed for this issue.
- Keep the two models' `LINK_TYPE_CHOICES` in lockstep; they are independently defined (no shared enum module) — this is pre-existing duplication, out of scope to refactor here.
