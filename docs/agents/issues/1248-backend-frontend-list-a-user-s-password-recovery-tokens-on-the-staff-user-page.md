# Issue: Backend/Frontend — list a user's password recovery tokens on the staff user page

## Description

Sub-issue of the parent tracking issue #1244 (Password Recovery Token Management Overhaul). The prerequisite sub-issues are already merged — #1245 (`PasswordResetToken` table rename), #1246 (expiration clamp to `[1, 1440]`), and #1247 (link the `/#/staff/users` rows to `/#/staff/users/:id` and prep it as the token-panel host). This is the next link in the strict `#1247 -> #1248 -> #1249` chain and is unblocked; it **blocks #1249** (staff recovery-token management actions).

This sub-issue adds a **read-only** recovery-token panel to the `/#/staff/users/:id` staff detail page so staff can inspect a user's outstanding `PasswordResetToken` records without direct DB access. Because the panel needs richer token state than the model stores today, this sub-issue also **owns the model's schema additions for the whole #1244 effort**: the `expires_at` / `invalidated_at` columns, the `is_valid()` rewrite, and the `HistoricalRecords` audit trail. All token *mutations* (unexpire / force-expire / delete / generate recovery link) are out of scope here and land in #1249.

## Problem

- `PasswordResetToken` stores only `token`, `created_at`, `used_at`. `is_valid()` computes expiry on the fly (`used_at is None and now <= created_at + Settings.password_reset_token_expiration_minutes()`), so a token's effective lifetime silently re-dates whenever the config changes, and there is no way to represent "revoked by staff" as distinct from "lapsed naturally". #1249's staff actions need both.
- There is no staff-facing endpoint or UI to view a user's recovery tokens; support/security work (helping a locked-out user, spotting a leaked link, confirming why a link no longer works) currently requires direct DB access.
- #1247 already added a `#renderRecoveryTokenPanel()` slot to `StaffUserHelper.jsx` that returns `null` — the panel content does not exist yet.

## Expected Behavior

- `PasswordResetToken` has `expires_at` (`NOT NULL`, materialised at issuance) and nullable `invalidated_at`; `is_valid()` becomes `used_at is None and invalidated_at is None and now <= expires_at`.
- After the migration, every in-flight token behaves **identically** to before: a partially-elapsed token keeps its remaining life, an already-expired token stays expired, and no existing token becomes "Revoked".
- `GET /staff/users/<id>/recovery-tokens.json` returns all of that user's tokens ordered `-created_at`, as metadata only — the serializer **never emits the raw `token`**.
- `/#/staff/users/:id` shows a recovery-token table: per-row status, `created_at`, `expires_at`, `used_at`, `invalidated_at`, and a masked preview; plus an empty state when the user has no tokens. No action controls on the panel (those are #1249).
- The panel loads **independently** of the rest of the detail page: it has its own loading and error state, and the user-detail block still renders if the token fetch fails.
- Row status is **recomputed on the frontend** from the row timestamps on every render (so `Expired` stays correct as a long-open page ages) — four mutually exclusive states, display precedence **Used > Revoked > Expired > Valid**:

  | Condition | Status |
  | --- | --- |
  | `used_at` set | **Used** |
  | `invalidated_at` set | **Revoked** |
  | `now > expires_at` | **Expired** |
  | otherwise | **Valid** |

- Every create / update / delete of a `PasswordResetToken` (including the backfill) is captured in `versioning_historicalpasswordresettoken` together with the acting user.

## Solution

### Token data model (owned by this sub-issue)

Add two columns to `PasswordResetToken`:

- **`expires_at`** (`DateTimeField`, **`NOT NULL`**) — **materialised at issuance** as `created_at + Settings.password_reset_token_expiration_minutes()`. A token's lifetime is fixed when minted; later config changes no longer retroactively re-date existing tokens. The model field is non-nullable, so any code path that mints a token without setting it fails loudly.
- **`invalidated_at`** (`DateTimeField`, nullable) — set when staff force-expire a token (the action lands in #1249). Keeps "revoked by staff" distinct from "lapsed naturally".

`is_valid()` becomes: `used_at is None and invalidated_at is None and now <= expires_at`.

Update the issuance paths in `accounts/views/password_reset/_shared.py` (`_create_and_send_reset_token`, `get_or_create_recovery_token`) to set `expires_at`. Note `created_at` is `auto_now_add`, so issuance-time code computes the value from `timezone.now()` (equivalently `created_at`).

### Migration

One migration file, three operations in order (`expires_at` lands `NOT NULL` without a table-wide default):

1. `AddField` `expires_at` **nullable**, plus `AddField` `invalidated_at` nullable.
2. **`RunPython` data migration** (pattern: `accounts/0004_backfill_userprofile_status_approved`) backfilling `expires_at = created_at + Settings.password_reset_token_expiration_minutes()` — **read at migration run time**, not hardcoded 30, so a non-default env value is honoured. `invalidated_at` is left `NULL` for all existing rows.
3. `AlterField` `expires_at` to `null=False`.

- **Deploy ordering: migration before code.** Additive columns are safe for old code (pre-change computed `is_valid()` ignores them); new code before the columns exist would `OperationalError`.
- **Rollback:** reverse migration drops both columns; `is_valid()` reverts to computed. Any staff `unexpire` override (far-future `expires_at`) is lost — acceptable for a rollback.

### Audit trail

Add `HistoricalRecords(app='versioning', user_db_constraint=False)` to `PasswordResetToken`, matching `accounts/models/authorization_request.py`. Needs a `versioning` migration creating `versioning_historicalpasswordresettoken` (fresh table, created after #1245's rename — no conflict). Gives a queryable trail of create / update / delete plus the acting user, consumed by #1249.

### Backend — list endpoint

New endpoint in the **`backend/staff/` app** (not `accounts/views/password_reset/`), following the established `staff/` pattern verbatim:

```python
@restricted                       # X-Skip-Cache: true on every response
@api_view(['GET'])
@permission_classes([AllowAny])   # auth enforced inline
def staff_user_recovery_tokens(request, user_id):
    error_response = require_staff(request)   # authenticated + AdminOrStaffCache.is_admin_or_staff
    if error_response:
        return error_response
    ...
```

- Route: `GET /staff/users/<int:user_id>/recovery-tokens.json`, registered in `staff/urls.py`.
- `get_object_or_404(User, pk=user_id)` for an unknown user.
- New serializer `staff/serializers/staff_recovery_token.py` — **explicit `fields` allowlist, never emits `token`**. Emits: `id`, `created_at`, `expires_at`, `used_at`, `invalidated_at`, a computed `status` (convenience only — the frontend recomputes it, see below), and a **masked preview** (last 6 chars of the token) for human cross-reference only.
- Order rows `-created_at`; return all of the user's tokens (no pagination — bulk operations are out of scope for #1244).

### Frontend — panel

- Add a `GET.recoveryTokens` entry to `staffUserConfig.js` (`staffUser` resource), path `/staff/users/:id/recovery-tokens.json`. Inline `staffOrSuperuser` gating via `AccessStore.ensureStaffOrSuperUser()`; no `RequestPermissionResolvers` entry (issue #842 — `staffUser` has none by design), `regular`/`private` point at the same object.
- **Independent fetch.** The panel does not ride on `StaffUserController`'s page load — it has its own controller (e.g. `StaffUserRecoveryTokensController`) with its own loading / error / data state, wired from `StaffUser.jsx` and rendered into `StaffUserHelper.#renderRecoveryTokenPanel()` (currently returns `null`). The user-detail block still renders if the token fetch fails; the panel shows its own error.
- Panel content: a table of rows showing status, `created_at`, `expires_at`, `used_at`/`invalidated_at`, masked preview.
- **Row status is computed on the frontend** from the row timestamps on every render (the serializer's `status` is not trusted for display, so `Expired` is correct even on a page left open past an expiry) — four mutually exclusive states, display precedence **Used > Revoked > Expired > Valid** (table above).
- Empty state when the user has no tokens. No action buttons (deferred to #1249).
- Frontend controller/helper specs plus the backend view tests (including migration-state / backfill tests).

### Security

- Metadata-only panel; the serializer never emits `token`; the only path to a working URL stays the explicit "Generate recovery link" action (added in #1249).
- `@restricted` keeps the token list out of the proxy cache.
- Never log the raw `token` — only `pk`, target user id, action, acting staff id.
- Route through the `security` and `data-access` reviewers (new endpoint, serializer fields, auth logic).

### Responsible agents

`backend`, `frontend` — coordinated through the `architect`. Review: `security`, `data-access`.

### Out of scope

- Token mutations: unexpire / force-expire / delete / "Generate recovery link" panel action — all in #1249.
- Pagination and bulk "delete all expired" — out of scope for #1244.
- Per-row "copy link" in the panel — deliberately excluded (would surface a working URL for any valid token).
- Expiration clamp (#1246) and table rename (#1245) — already merged.

## Acceptance criteria

- [ ] `PasswordResetToken` has `expires_at` (`NOT NULL`, materialised at issuance) and nullable `invalidated_at`; `is_valid()` = `used_at is None and invalidated_at is None and now <= expires_at`
- [ ] One migration file: add both columns nullable -> `RunPython` backfill of `expires_at` reading `Settings.password_reset_token_expiration_minutes()` at run time (`invalidated_at` left `NULL`) -> `AlterField` `expires_at` to `null=False`
- [ ] Issuance paths (`_create_and_send_reset_token`, `get_or_create_recovery_token`) set `expires_at`
- [ ] `PasswordResetToken` has `HistoricalRecords(app='versioning', user_db_constraint=False)` + the `versioning` migration
- [ ] `GET /staff/users/<id>/recovery-tokens.json` in `backend/staff/`, `@restricted` + `require_staff`, serializer with an explicit `fields` allowlist that never emits `token` (emits `id`, timestamps, convenience `status`, last-6 masked preview)
- [ ] `/#/staff/users/:id` shows the token panel via its own controller (independent loading/error state; page still renders if it fails), with per-row status computed client-side (Used/Revoked/Expired/Valid), masked preview, and an empty state; no mutation controls
- [ ] Backend view tests (incl. migration-state / backfill) and frontend controller/helper specs

## Benefits

- Staff can triage password-recovery problems (locked-out users, leaked links) straight from the UI, with no direct DB access.
- Materialised expiry makes a token's lifetime deterministic and gives #1249 a stable `is_valid()` / column contract to build its actions on.
- The `HistoricalRecords` audit trail exists from the moment the columns ship, so #1249's actions are auditable from day one.
