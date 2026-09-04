# Frontend Plan: Backend/Frontend — staff recovery token management actions (unexpire / force-expire / delete)

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the three backend endpoints and must match their paths/methods/response shapes exactly
(see [plan.md](plan.md)'s "Shared contracts" section). Implements the post-action refresh contract
(`RequestStore.purge` + re-fetch) that every action — including the existing `recoveryLink`
generate — must follow. Consumes the i18n keys `translator` adds (see [translator.md](translator.md)).

## Steps

- [01 — Add request-config entries](frontend/01-add-request-config-entries.md)
- [02 — Add action handlers to the tokens controller](frontend/02-add-controller-action-handlers.md)
- [03 — Build the action confirmation modal](frontend/03-build-action-confirm-modal.md)
- [04 — Render row actions and the generate button](frontend/04-render-actions-and-generate-button.md)
- [05 — Wire the page together](frontend/05-wire-staff-user-page.md)
- [06 — Tests](frontend/06-tests.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `StaffUserController` already redirects non-staff/non-superusers away before this page (and its
  panel) mounts — no extra `AccessStore` check needed in any new code here, same precedent as
  `StaffUserRecoveryTokensController`'s existing doc comment.
- The panel-level "Generate recovery link" is a *new*, independent call site from the existing
  list-page one in `StaffUsersController.handleGenerateRecoveryLink` — no shared code between them,
  same precedent as today's two independent per-page controllers.
