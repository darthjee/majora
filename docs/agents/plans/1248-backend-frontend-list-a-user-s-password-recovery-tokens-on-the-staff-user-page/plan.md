# Plan: Backend/Frontend — list a user's password recovery tokens on the staff user page

Issue: [1248-backend-frontend-list-a-user-s-password-recovery-tokens-on-the-staff-user-page.md](../issues/1248-backend-frontend-list-a-user-s-password-recovery-tokens-on-the-staff-user-page.md)

## Overview

Add a **read-only** recovery-token panel to `/#/staff/users/:id`, backed by a new `GET /staff/users/<id>/recovery-tokens.json` endpoint in `backend/staff/`. This sub-issue also owns the shared `PasswordResetToken` schema work for the whole #1244 effort: materialised `expires_at` (`NOT NULL`), nullable `invalidated_at`, a rewritten `is_valid()`, and a `HistoricalRecords` audit trail — all consumed by #1249's mutation endpoints later. No mutation UI ships here.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoint:** `GET /staff/users/<int:user_id>/recovery-tokens.json`
- Auth: `@restricted` + inline `require_staff` (401 unauthenticated, 403 non-staff/superuser), `get_object_or_404(User, pk=user_id)` (404 unknown user) — verbatim `staff/` pattern (cf. `staff_user_recovery_link.py`).
- Response body: a **plain JSON array** (no pagination wrapper), ordered `-created_at`, one object per `PasswordResetToken` row owned by that user:

  ```json
  [
    {
      "id": 42,
      "status": "valid",
      "created_at": "2026-09-04T10:00:00Z",
      "expires_at": "2026-09-04T10:30:00Z",
      "used_at": null,
      "invalidated_at": null,
      "token_preview": "aZ91Qk"
    }
  ]
  ```

  - `status` — one of `"used"` / `"revoked"` / `"expired"` / `"valid"` (precedence Used > Revoked > Expired > Valid). Backend emits it as a **convenience only**; the frontend recomputes its own status from `used_at` / `invalidated_at` / `expires_at` on every render rather than trusting this field, so a long-open page never shows a stale status. Both implementations must agree on the same precedence rule.
  - `created_at` / `expires_at` / `used_at` / `invalidated_at` — ISO-8601 datetime strings (DRF default `DateTimeField` serialization), `used_at`/`invalidated_at` nullable.
  - `token_preview` — last 6 characters of the raw token. **The raw `token` field is never emitted** — the serializer's `fields` list is an explicit allowlist.
  - No `user` field needed — the id is already in the URL.

- Frontend consumes it via `RequestStore.ensure({ resource: 'staffUser', quantityType: 'recoveryTokens', params: { id } })`, added as `GET.recoveryTokens` in `staffUserConfig.js` (mirrors the existing `GET.collection`/`GET.single` entries: `regular`/`private` point at the same path object, no `RequestPermissionResolvers` entry — issue #842). `RequestStore.ensure()` always resolves `{ data, pagination }`; `data` here is the raw array above, `pagination` is ignored (same as every `single`-quantity-type consumer today).

**Model contract** (`accounts.models.PasswordResetToken`), consumed by #1249 later:
- `expires_at` — `DateTimeField`, `null=False`, with a model-level `default` callable (`timezone.now() + timedelta(minutes=Settings.password_reset_token_expiration_minutes())`) so any ad-hoc `PasswordResetToken.objects.create(...)` call site across the codebase (existing tests included) keeps working without every call site being audited/updated. The issuance paths in `_shared.py` still set it explicitly for clarity/intent, even though it would resolve to the same value via the default.
- `invalidated_at` — `DateTimeField`, `null=True`.
- `is_valid()` == `used_at is None and invalidated_at is None and timezone.now() <= expires_at`.
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)`.

## Notes

- Prerequisite sub-issues #1245 (table rename), #1246 (expiration clamp), #1247 (detail-page host + `#renderRecoveryTokenPanel()` slot) are already merged on `main`.
- Out of scope here (all land in #1249): unexpire / force-expire / delete endpoints, the panel's "Generate recovery link" action, any mutation controls in the UI.
