# Backend Plan: Fix admin access

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads the `CSRF_TRUSTED_ORIGINS` env var (comma-separated full origins, with scheme) and must default to an empty list when the var is unset or empty — do not default to `*` or any other permissive value, since Django requires each entry to be a valid scheme+host.

## Implementation Steps

### Step 1 — Add `CSRF_TRUSTED_ORIGINS` setting
In `source/majora_project/settings.py`, right after the existing `ALLOWED_HOSTS` line, add:

```python
CSRF_TRUSTED_ORIGINS = [
    origin for origin in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if origin
]
```

The list comprehension filters out empty strings so an unset/empty env var produces `[]` instead of `['']` (which Django would reject as an invalid origin).

## Files to Change
- `source/majora_project/settings.py` — add `CSRF_TRUSTED_ORIGINS` populated from the new env var, filtering empty entries.

## CI Checks
- `source`: `pytest` (CI job: `pytest`)
- `source`: `ruff check` (CI job: `checks`)

## Notes
- No new test is added: the existing `ALLOWED_HOSTS` line one row above follows the same inline `os.environ.get(...)` pattern with no dedicated unit test, so this stays consistent with current settings.py conventions.
