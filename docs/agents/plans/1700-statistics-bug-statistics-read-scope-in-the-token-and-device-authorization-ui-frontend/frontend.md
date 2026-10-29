# Frontend Plan: Statistics bug: statistics:read scope in the token and device-authorization UI (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

- `statistics:read` is the only scope of family `statistics`; the UI group `statistics` is last.
- Authorization requests may carry `scopes: Array<string>` (#1708).
- Translation keys listed in [plan.md](plan.md#shared-contracts), provided by the translator.

## Steps

- [01 — Statistics group in the scope helpers](frontend/01-scope-group.md)
- [02 — Keep statistics out of "Select all"](frontend/02-select-all.md)
- [03 — Scopes on the approval modal](frontend/03-approval-modal.md)

## CI Checks

- `frontend`: Jasmine specs and ESLint through docker-compose (CI jobs: `jasmine`,
  `frontend-checks`)

## Notes

- No client-side staff check and no direct `AccessStore` call: the token page shows what
  `options.json` returns.
- Badges (owner token list, `StaffUserApiTokensHelper`) come for free from `groupScopes`; only
  add a spec.
- The approval modal must render catalogue labels only, never raw client text; unknown scopes are
  dropped (as `groupScopes` already does).
- #1708 defines the request payload; if its field name differs from `scopes`, follow #1708.
