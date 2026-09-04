# Plan: Backend/Frontend — staff recovery token management actions (unexpire / force-expire / delete)

Issue: [1249-backend-frontend-staff-recovery-token-management-actions-unexpire-force-expire-delete.md](../../issues/1249-backend-frontend-staff-recovery-token-management-actions-unexpire-force-expire-delete.md)

## Overview

Adds three staff-only mutation endpoints under `backend/staff/` (`unexpire`, `force-expire`,
`delete`) on a user's `PasswordResetToken` rows, and wires matching row-level action buttons plus
a panel-level "Generate recovery link" button into the existing recovery-token panel on
`/#/staff/users/:id`. Every action re-fetches the whole token list on success — there is no
in-place row patching.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New backend endpoints (produced by `backend`, consumed by `frontend`)

All three live in `backend/staff/`, registered in `backend/staff/urls.py`, nested under
`staff/users/<int:user_id>/recovery-tokens/<int:token_id>/...`, following the existing
`staff_user_recovery_link`/`staff_user_recovery_tokens` pattern exactly: `@restricted` (this
already sets `X-Skip-Cache: true` unconditionally — no extra work needed for that) +
`@api_view([...])` + `@permission_classes([AllowAny])` + inline `require_staff(request)` first,
then `get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)` for the ownership
check (404 on mismatch — this is also what makes a stale/concurrent-delete row 404 for free).

| Method + path | URL name | Effect | Success response |
| --- | --- | --- | --- |
| `POST .../recovery-tokens/<token_id>/unexpire.json` | `staff-user-recovery-token-unexpire` | `invalidated_at = NULL`; `expires_at = now + Settings.password_reset_token_expiration_minutes()`; **never touches `used_at`** | `200 {}` |
| `POST .../recovery-tokens/<token_id>/force-expire.json` | `staff-user-recovery-token-force-expire` | `invalidated_at = now` | `200 {}` |
| `DELETE .../recovery-tokens/<token_id>.json` | `staff-user-recovery-token-delete` | Deletes the row | `204 No Content` |

No token-state guard rails on any of the three — they accept any action on any token regardless
of current status; the frontend only hides the no-op buttons (see below).

### Frontend request config (produced by `frontend`, must match the table above exactly)

Three new quantity types on the `staffUser` resource in `staffUserConfig.js`, each keyed by both
`id` (user) and `tokenId`:

- `POST.unexpireRecoveryToken` → `({ id, tokenId }) => \`/staff/users/${id}/recovery-tokens/${tokenId}/unexpire.json\``
- `POST.forceExpireRecoveryToken` → `.../force-expire.json`
- `DELETE.deleteRecoveryToken` → `\`/staff/users/${id}/recovery-tokens/${tokenId}.json\`` (no action
  suffix)

Same `permission: null` / no `RequestPermissionResolvers` entry / no `variantName` shape as
`recoveryLink`/`recoveryTokens` — client-side gating is already `staffOrSuperuser` via
`AccessStore.ensureStaffOrSuperUser()` in `StaffUserController`, enforced again server-side by
`require_staff`.

### Post-action refresh contract (frontend-internal, but pinned here since every step relies on it)

Every successful action — `unexpireRecoveryToken`, `forceExpireRecoveryToken`,
`deleteRecoveryToken`, and the panel-level reuse of the existing `POST.recoveryLink`
("Generate recovery link") — calls `RequestStore.purge({ resource: 'staffUser' })` and then
re-runs the token-list fetch (`RequestStore.ensure` with `quantityType: 'recoveryTokens'`), the
same way a stale-404 is already specified to recover. No handler ever patches a single row from
the mutation's own response body — the three mutation endpoints intentionally return no token
data (see the response column above).

### i18n keys (produced by `translator`, consumed by `frontend`)

New keys needed under `staff_user_page` (buttons) and a new confirm-modal namespace (mirroring
`clear_cache_confirm_modal`'s shape in `common.yaml`) — see [translator.md](translator.md) for the
exact key list.
