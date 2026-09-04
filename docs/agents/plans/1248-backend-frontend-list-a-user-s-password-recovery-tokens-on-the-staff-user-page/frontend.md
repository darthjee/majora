# Frontend Plan: Backend/Frontend — list a user's password recovery tokens on the staff user page

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md#shared-contracts) for the full endpoint response shape. This agent **consumes** it: a plain JSON array (no pagination), with `token_preview` and a convenience `status` this agent must **not** trust for display — status is recomputed client-side from `used_at`/`invalidated_at`/`expires_at` on every render, precedence Used > Revoked > Expired > Valid.

## Steps

- [01 — staffUserConfig.js: GET.recoveryTokens](frontend/01-staff-user-config.md)
- [02 — Row-status utility](frontend/02-row-status-utility.md)
- [03 — Panel controller (independent fetch)](frontend/03-panel-controller.md)
- [04 — Panel rendering (StaffUserHelper + StaffUser.jsx)](frontend/04-panel-rendering.md)
- [05 — i18n keys](frontend/05-i18n.md)
- [06 — Specs](frontend/06-specs.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) — must pass after Step 5 adds the same keys to every locale.

## Notes

- No mutation controls in this panel (unexpire/force-expire/delete/generate — all #1249). The panel is display-only: table + empty state.
- Panel loads independently of the rest of the page (its own loading/error state); a token-fetch failure must not blank out the name/email/status block above it.
