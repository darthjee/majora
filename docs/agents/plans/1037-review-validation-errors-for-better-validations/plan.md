# Plan: Review validation errors for better validations

Issue: [1037-review-validation-errors-for-better-validations.md](../issues/1037-review-validation-errors-for-better-validations.md)

## Overview

Audit every create/update serializer and manual DB-write call site for user-supplied string
fields that could leak a raw DB error instead of a clean 400, then retrofit the entire validation
error surface (~48 existing `ValidationError`/`{'errors': ...}` call sites) to a consistent,
translatable shape: `{'errors': {field_or_detail: [code, ...]}}`, where `code` is a stable string
(not free text) that the frontend resolves via `Translator.t('errors.<code>')`. Also fixes a real
bug where non-field `detail` errors are currently silently dropped by the frontend.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Error code convention (resolves the issue's "still open" question)

Every validation error becomes a **code string** instead of free text, carried as the error
message itself (not DRF's separate `code=` metadata, which never reaches the JSON response):

- **Custom/business-logic errors** (raised explicitly via `serializers.ValidationError(...)` or a
  hardcoded `Response({'errors': ...})`): each gets its own specific `snake_case` code, e.g.
  `session_wrong_game`, `max_tags_exceeded`, `poll_not_open`, `not_allowed`,
  `authentication_required`. Backend raises `serializers.ValidationError('<code>', code='<code>')`
  (or a raw `Response({'errors': {'detail': ['<code>']}}, status=...)` for non-serializer view
  code) — the code is the literal string that lands in the JSON response.
- **DRF `ModelSerializer` auto-generated field validators** (from model constraints like
  `max_length`, `required`, `unique`, `blank`, `null`): DRF already assigns each `ErrorDetail` a
  stable `.code` matching the validator type (`'max_length'`, `'required'`, `'unique'`, etc.), but
  doesn't serialize it — only the English message. A shared helper (see
  [backend.md](backend.md)) rewrites `serializer.errors` to emit `detail.code` instead of the
  message text, for free, across every `ModelSerializer` field — no per-field changes needed.
  These codes are intentionally generic (shared across every field of that constraint type,
  e.g. every `max_length` violation on any field uses the same `errors.max_length` translation).

### Response shape

`{'errors': {<field_name_or_'detail'>: ['<code>', ...]}}` — no submitted-data echo. Already the
project's existing convention (`games/views/common.py`'s `validated_or_error`/`save_or_error`), so
no shape change, only the array contents change from message strings to codes.

### Translation keys

Every code becomes a key under the `errors:` namespace in
`frontend/assets/i18n/{en,pt}.yaml` — flat, one entry per code, e.g.:

```yaml
errors:
  max_length: "This field is too long."
  required: "This field is required."
  session_wrong_game: "Session must belong to the same game."
  max_tags_exceeded: "An STL model may have at most 20 tags."
  poll_not_open: "Poll must be open to accept votes."
  not_allowed: "You are not allowed to do this."
  authentication_required: "Authentication required."
```

No interpolation/placeholder support is added to `Translator.t` (it's a plain dot-path string
lookup today, `t(key, fallback)`) — where a message currently embeds a dynamic value (e.g. a
specific tag limit), the translated text simply states that fixed value directly, same as today.
This is a deliberate scope call to avoid building an interpolation feature for a handful of cases.

Frontend renders each code via `Translator.t(\`errors.${code}\`, code)` (falling back to the raw
code string if a translation is ever missing, rather than crashing) — see
[frontend.md](frontend.md).

### Non-field errors

Backend: business-logic 400s and permission 401/403s that aren't tied to a specific field already
use (and will continue to use) the `'detail'` key: `{'errors': {'detail': ['<code>']}}`.

Frontend: `ShowPageLayout.jsx` renders `<ErrorAlert error={Translator.t(...)} />` for
`context.fieldErrors?.detail`, above the slot body, in `new`/`edit` mode only, visible only when
present — one change covers every resource's create/edit form.

## Notes

- The `Tag.name`/`StlModelCreateSerializer.tags` `max_length=200` values already match, but
  nothing enforces they stay in sync — backend's plan extracts a shared constant to close that
  drift risk permanently (see [backend.md](backend.md)'s Step 2).
- This is a large, mechanical sweep (~48 call sites, 23 serializers). Backend should feel free to
  batch the mechanical conversions; the only genuinely novel piece is the `error_codes` helper and
  the two identified risk-pattern fixes.
