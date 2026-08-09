# Backend Plan: Review validation errors for better validations

Main plan: [plan.md](plan.md)

## Shared contracts

- Every validation error becomes a **code string** (see [plan.md](plan.md#error-code-convention-resolves-the-issues-still-open-question)):
  custom errors get a specific `snake_case` code passed as both the `ValidationError` message and
  its `code=`; DRF's own `ModelSerializer` field-validator codes (`max_length`, `required`,
  `unique`, `blank`, `null`, ...) are reused as-is via a shared error-rewriting helper.
- Response shape stays `{'errors': {field_or_detail: [code, ...]}}` — only the array contents
  change from message text to codes. No submitted-data echo.
- Non-field errors keep using the `'detail'` key.
- Frontend and translator depend on the **final list of codes** this work produces — keep a running
  list (e.g. in the PR description or a comment) so `translator` can add matching yaml entries.

## Implementation Steps

### Step 1 — Add the error-code rewriting helper

In `games/views/common.py` (already the shared home for `validated_or_error`/`save_or_error`),
add a helper that walks a DRF errors structure (`serializer.errors` or a caught
`ValidationError.detail` — both are nested dicts/lists of `ErrorDetail`, a `str` subclass exposing
`.code`) and replaces each entry with its `.code` instead of its message text, recursively (nested
serializers/list fields produce nested structures).

```python
def _error_codes(errors):
    """Recursively replace ErrorDetail messages with their `.code`, preserving structure."""
    if isinstance(errors, dict):
        return {key: _error_codes(value) for key, value in errors.items()}
    if isinstance(errors, list):
        return [_error_codes(item) for item in errors]
    return getattr(errors, 'code', errors)
```

Update `validated_or_error` and `save_or_error` to run their error payload through `_error_codes`
before building the `Response`:

```python
def validated_or_error(serializer):
    if not serializer.is_valid():
        return Response({'errors': _error_codes(serializer.errors)}, status=400)
    return None

def save_or_error(serializer, **kwargs):
    try:
        return serializer.save(**kwargs), None
    except ValidationError as exc:
        return None, Response({'errors': _error_codes(exc.detail)}, status=400)
```

Every call site that currently builds `Response({'errors': serializer.errors}, ...)` or
`Response({'errors': exc.detail}, ...)` directly (outside these two helpers) must be updated the
same way, or switched to call the helpers instead if that's a cleaner fit.

### Step 2 — Close the `Tag.name` / `tags` max_length drift risk

`miniatures/models/tag.py`'s `Tag.name = models.CharField(max_length=200, unique=True)` and
`miniatures/serializers/stl_model_create.py`'s
`tags = ListField(child=CharField(max_length=200), ...)` currently duplicate the `200` by hand.
Extract a shared constant (e.g. `Tag.NAME_MAX_LENGTH = 200` on the model) and reference it from
the serializer's `CharField(max_length=Tag.NAME_MAX_LENGTH)`, so the two can never drift apart
again. Add a code for this validation failure (e.g. `tag_name_too_long`) via the field's
`error_messages={'max_length': 'tag_name_too_long'}` override (this is the one case where a
manually-declared field benefits from a specific, non-generic code, since "which field" matters
for the message).

### Step 3 — Convert existing call sites to codes

Convert every existing `serializers.ValidationError(...)` / hardcoded `{'errors': ...}` call site
to raise/return a code instead of a message. Group by file (all outside `tests/`/`migrations/`):

- `games/views/common.py` (6 sites, includes `UNAUTHENTICATED_RESPONSE_DATA`)
- `permissions/endpoint.py` (2 sites: `_UNAUTHENTICATED_RESPONSE_DATA`, `_FORBIDDEN_RESPONSE_DATA`
  → `authentication_required`, `not_allowed`)
- `accounts/serializers/auth/my_account_update.py` (4)
- `games/serializers/characters/character_link_write.py` (4)
- `games/serializers/games/game_link_write.py` (3)
- `games/serializers/games/polls/poll_create.py` (2)
- `games/serializers/games/polls/poll_vote_write.py` (1)
- `games/serializers/games/polls/session_poll_create.py` (1)
- `games/serializers/games/tasks/game_task_create.py` (1)
- `games/serializers/games/tasks/game_task_update.py` (1)
- `games/serializers/games/treasures/game_treasure_link.py` (2)
- `games/serializers/photo_upload.py` (1)
- `games/views/game/_document_exchange.py` (1)
- `games/views/game/_treasure_exchange.py` (3)
- `games/views/game/conversations/game_conversations.py` (1)
- `games/views/games/games_list.py` (1)
- `games/views/polls/game_poll_close.py` (1)
- `games/views/polls/game_poll_votes.py` (2)
- `games/views/treasures/treasure_detail.py` (1)
- `games/views/treasures/treasures_list.py` (1)
- `games/views/upload_finalize.py` (1)
- `miniatures/serializers/_tags_sync.py` (1 — `MAX_TAGS` check → `max_tags_exceeded`)
- `miniatures/views/_shared.py` (1)
- `staff/serializers/staff_user_update.py` (2)
- `staff/views/staff_user_approve.py` (2)
- `staff/views/staff_user_deny.py` (1)
- `staff/views/staff_users_list.py` (1)

For each: pick a `snake_case` code describing the concern (reuse an existing code where the
concern is genuinely identical, e.g. multiple "not found" sites can share `not_found`), pass it as
the `ValidationError` message/`code=` (or the literal in a hardcoded `{'errors': {...}}` dict), and
keep a running list of `code -> original English text` — this list is what `translator` needs.

### Step 4 — Audit the remaining create/update serializers + manual-write call sites

All 23 `ModelSerializer`-based create/update serializers auto-validate model-derived fields
already; confirm each one still does (no field manually redeclared in a way that drops the model's
constraint) and fix any found gap the same way as Step 2. Also check the manual
`get_or_create`/`.objects.create()` call sites that write user-supplied strings outside a
serializer's own `validated_data` (beyond the `_tags_sync.py` case already fixed in Step 2) —
most operate on internally-controlled data and need no change, but confirm each one.

### Step 5 — Tests

- For each site converted in Steps 2–4 that previously risked a raw DB error (500), add/update a
  test asserting the offending input now returns 400 with the expected code.
- For every other converted site, update existing tests to assert on the new code instead of the
  old message text.
- No behavior regression: status codes for already-passing validations stay the same.

## Files to Change

- `games/views/common.py` — add `_error_codes` helper; wire into `validated_or_error`/
  `save_or_error`; convert this file's own 6 call sites.
- `permissions/endpoint.py` — convert 2 call sites to codes.
- `miniatures/models/tag.py`, `miniatures/serializers/stl_model_create.py`,
  `miniatures/serializers/_tags_sync.py` — shared `NAME_MAX_LENGTH` constant + code conversion.
- The remaining ~22 files listed in Step 3 — convert each call site to a code.
- Corresponding files in `*/tests/` for every file touched above.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check --fix .` (CI job: `checks`)

## Notes

- The generic DRF-derived codes (`max_length`, `required`, `unique`, `blank`, `null`, `invalid`,
  ...) are shared across every field of that type — only custom business-logic codes need to be
  distinct per concern. Keep the code list flat; no per-field namespacing.
- Codes are static strings with no interpolation — see [plan.md](plan.md)'s Notes on why.
