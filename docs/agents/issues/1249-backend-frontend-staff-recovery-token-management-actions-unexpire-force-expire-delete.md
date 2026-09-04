## Context

Parent tracking issue: #1244 (Password Recovery Token Management Overhaul).

Building on the read-only recovery-token panel, this sub-issue lets staff **act** on individual tokens from the `/#/staff/users/:id` page: unexpire, force-expire, delete, and generate a fresh recovery link.

## Backend — action endpoints

All in the **`backend/staff/` app**, nested under the user, registered in `staff/urls.py`, following the established `staff/` pattern (`@restricted` + `@api_view` + `@permission_classes([AllowAny])` + inline `require_staff`). Each verifies token ownership: `get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)` → 404 on mismatch.

| Method + path | Effect |
| --- | --- |
| `POST /staff/users/<id>/recovery-tokens/<token_id>/unexpire.json` | `invalidated_at = NULL` **and** `expires_at = now + Settings.password_reset_token_expiration_minutes()` (fresh full configured window). **Never touches `used_at`.** |
| `POST /staff/users/<id>/recovery-tokens/<token_id>/force-expire.json` | `invalidated_at = now`. |
| `DELETE /staff/users/<id>/recovery-tokens/<token_id>.json` | Delete the row. |

- **Response body:** `unexpire`/`force-expire` return a minimal success body (e.g. `{}`/204) — no need to serialize the updated token. The panel always re-fetches the whole list after any successful action, same as `generate` and the stale-404 error path, rather than patching a single row in place. `delete` returns 204 with no body.
- **No backend guard rails on token state.** The endpoints accept any action on any token regardless of its current state (e.g. unexpiring an already-used token is permitted, though it stays invalid because `used_at` is set). Keeps the endpoints simple and predictable.
- **Permissions:** `require_staff` (staff OR admin/superuser) for all three, including `force-expire` and `delete`. No staff/superuser split — these are strictly less powerful than the already-`require_staff`-gated `recovery-link` endpoint.
- **Audit:** rely on the `HistoricalRecords` added in the listing sub-issue for the update/delete trail. Never log the raw `token` — only `pk`, target user id, action, acting staff id.

## "Generate recovery link" on the panel

Reuse the **existing** `POST /staff/users/<id>/recovery-link.json` endpoint (already wired as `POST.recoveryLink` in `staffUserConfig.js`) — no new backend endpoint. After a successful generate, the panel re-fetches so the new/reused token appears in the list. The existing list-page "Generate recovery link" button stays as-is.

Once the new `is_valid()` is in place (listing sub-issue), a force-expired token fails `is_valid()`, so `get_or_create_recovery_token` mints a fresh one rather than returning the killed token — the desired behaviour. Confirm the reuse query works against the new fields.

## Frontend — panel controls

- Add `POST` (unexpire, force-expire) + `DELETE` entries to `staffUserConfig.js` (`staffUser` resource); same inline `staffOrSuperuser` gating, no `RequestPermissionResolvers` entry, no `variantName` (single variant).
- **State-appropriate action visibility** — the panel's client-computed row status (`RecoveryTokenStatusBadges.computeStatus`, precedence `used > revoked > expired > valid`) drives which actions show:
  - `unexpire` shown on both **Expired** and **Revoked** (force-expired) rows — so a staff member can undo an accidental `force-expire`, matching the backend, which already accepts `unexpire` on any token state.
  - `force-expire` shown only on **Valid** rows.
  - `delete` shown on every row (`used`, `revoked`, `expired`, `valid`).
  - `Generate recovery link` is panel-level, not per-row.
  - The backend still accepts any action on any token regardless of status — the UI just hides the no-ops (e.g. `force-expire` on an already-`used` row would be a no-op since `used_at` alone already fails `is_valid()`).
- **Confirmation dialog on `delete` and `force-expire`** (reuse the `ClearCacheConfirmModal` pattern from `staff_dashboard`). `unexpire` and `generate` are one-click.
- **Post-action refresh:** every successful action (`unexpire`, `force-expire`, `delete`, `generate`) re-fetches the full token list — no in-place row patching, one consistent refresh rule.
- **Stale list / concurrent delete:** the second action 404s; the panel shows an error and re-fetches.
- **delete the last valid token** is allowed (it *is* "revoke").

## Security

- Force-expire is the primary tool for revoking a leaked recovery link. `reset_password` re-reads the row and calls `is_valid()` (now including `invalidated_at is None`) on every attempt — no validity caching, so force-expire takes effect instantly.
- Route through the `security` and `data-access` reviewers (new endpoints, auth logic).

## Responsible agents

`backend`, `frontend` — coordinated through the `architect`. Review: `security`, `data-access`.

## Dependencies

Depends on the "list a user's recovery tokens" sub-issue of #1244 (the `expires_at`/`invalidated_at` columns, `is_valid()` semantics, `HistoricalRecords`, the `staffUserConfig.js` `GET.recoveryTokens` pattern, and the panel section it consumes).

## Acceptance criteria

- [ ] `POST .../unexpire.json` clears `invalidated_at` and sets `expires_at = now + configured window`; never touches `used_at`
- [ ] `POST .../force-expire.json` sets `invalidated_at = now`; `DELETE .../<token_id>.json` deletes the row
- [ ] All three endpoints: `backend/staff/`, nested under the user, `@restricted` + `require_staff`, ownership check → 404 on user mismatch, no token-state guards
- [ ] Panel exposes unexpire (Expired + Revoked rows), force-expire (Valid rows), delete (all rows), and a panel-level "Generate recovery link" reusing the existing `recovery-link` endpoint
- [ ] Confirmation dialog on delete and force-expire; unexpire and generate are one-click; stale-list 404 shows an error and re-fetches
- [ ] Every successful action (unexpire, force-expire, delete, generate) re-fetches the full token list rather than patching a single row in place
- [ ] Backend view tests and frontend controller/helper specs
