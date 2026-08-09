# Issue: Review validation errors for better validations

## Description
Several create/update serializers rely on model/DB-level constraints (e.g. `CharField(max_length=...)`) rather than explicit serializer-level validation, which can surface as a raw DB error/500 instead of a clean per-field 400. This issue is a full audit and retrofit pass across the codebase to make validation errors explicit and consistent, spun off from #1036 while deciding how the STL model `tags` field should validate an over-length tag string.

## Problem
- ~48 call sites raise `serializers.ValidationError` or build `{'errors': ...}` responses across the codebase, with inconsistent message content (hardcoded English strings) and no shared translation strategy, even though the app is fully bilingual (`frontend/assets/i18n/en.yaml`/`pt.yaml`).
- Two patterns risk leaking raw DB errors as 500s instead of clean 400s:
  1. Manually re-declared serializer fields that bypass model-derived validation and must be kept in sync by hand with the model's own constraints (e.g. `StlModelCreateSerializer.tags`'s `CharField(max_length=200)`, which must track `Tag.name`'s `max_length=200`).
  2. Manual/secondary DB writes that bypass `serializer.validated_data` entirely (e.g. `_tags_sync.py`'s `Tag.objects.get_or_create(name=name.lower())`).
- A related, currently-invisible bug: `BaseEditController#handleResponse` calls `setFieldErrors(data.errors ?? {})` on every 400, but several endpoints return non-field errors under a `detail` key (e.g. `games/views/polls/game_poll_votes.py`). No frontend component reads `fieldErrors.detail`, so these errors are silently swallowed — the user submits and nothing visibly happens.

## Expected Behavior
- Every user-supplied string field on a create/update endpoint is protected by either DRF's `ModelSerializer` auto-validation or an explicit `serializers.ValidationError`, never a raw DB error.
- Every validation error response follows `{'errors': {field_or_detail: [codes]}}`, with no echo of submitted data (form fields are already controlled components, so this isn't needed).
- Error codes, not hardcoded messages, are what serializers raise and the API returns; the frontend resolves them to localized text via `Translator.t(code)`, with entries in both `en.yaml` and `pt.yaml`.
- Non-field (`detail`) validation errors are visibly rendered to the user, not silently dropped.

## Solution

### Response shape
No data echo. Keep the project's existing convention, already standard across `staff/`, `games/`, and `miniatures/` views (via `validated_or_error`/`save_or_error` in `games/views/common.py`) and already consumed by the frontend (`BaseEditController#handleResponse` reads `data.errors`):
```json
{
  "errors": {
    "name": ["name_too_long"]
  }
}
```

### Message content
Backend raises `serializers.ValidationError` with a stable code (DRF's `ValidationError` supports `code=` separately from the display detail, though it isn't surfaced in the JSON response today — only the message is). The frontend's `FieldErrors.jsx` translates via `Translator.t(code)`, with matching entries added to both `en.yaml` and `pt.yaml`. Exact code-naming convention and how codes flow into the JSON response are implementation-time decisions.

### Scope (full audit)
All 23 create/update serializers are `ModelSerializer` subclasses, so DRF already auto-generates `max_length` (and other) validators for model-derived fields — the real risk is narrower than "missing validation everywhere." Audit and fix, specifically:
1. Manually re-declared fields that bypass model-derived validation.
2. Manual/secondary DB writes that bypass `serializer.validated_data`.

### Full retrofit
Every existing hardcoded `ValidationError`/`{'errors': ...}` call site (~48 across the codebase, excluding tests/migrations) gets converted to a code + yaml entry, not just newly-fixed ones — including the existing `detail`-keyed non-field errors (auth/permission responses), which already fit the `{errors: {...}}` shape today.

### Non-field errors
Reuse `ErrorAlert.jsx` (the existing Bootstrap danger-alert component already used for the generic `status === 'error'` case in resource Heading components) to render `detail` errors, visible only when present. Placement: inside `ShowPageLayout.jsx`, right before the slot body renders, where `context.fieldErrors` is already available for every New/Edit page — one change covers every resource form, consistent with this codebase's existing pattern of shared primitives (`FieldErrors`, `FormField`, `TagsField`) over per-resource duplication. Rejected: adding it to each resource's Heading component or Helper render, both of which would repeat the same snippet once per resource.

### Acceptance criteria
- [ ] Every create/update serializer confirmed to protect its user-supplied string fields, either via `ModelSerializer` auto-validation (model-derived fields) or explicit `ValidationError` (manually-declared fields and manual DB writes bypassing `validated_data`). Any gap found gets fixed.
- [ ] Every `ValidationError`/`{'errors': ...}` call site (existing and newly-added) raises with a stable code rather than (or alongside) a hardcoded message.
- [ ] Every response follows `{'errors': {field_or_detail: [codes]}}`, no submitted-data echo — including existing `detail`-keyed non-field errors.
- [ ] `frontend/assets/i18n/en.yaml` and `pt.yaml` both get an entry for every code introduced, and `FieldErrors.jsx` (or its caller) translates via `Translator.t(code)` instead of rendering the raw server string.
- [ ] `ShowPageLayout.jsx` renders `<ErrorAlert .../>` for `context.fieldErrors?.detail` when in `new`/`edit` mode, above the slot body, visible only when present.
- [ ] For each fixed gap (previously a raw DB error/500), a test confirms the offending input now returns a 400 with the correct code instead.
- [ ] No behavior regression: every validation that already worked correctly continues to return the same outcome (still a 400, just via a code instead of free text).

## Benefits
- No more raw DB errors/500s leaking to API consumers on validation failure.
- Consistent, predictable error response contract across the entire API.
- Full bilingual support for validation error messages, matching the rest of the app's UX.
- Fixes a real bug where non-field validation errors are currently invisible to users.
