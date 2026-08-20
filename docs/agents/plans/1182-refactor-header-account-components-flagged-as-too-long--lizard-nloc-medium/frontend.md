# Frontend Plan: Refactor Header/Account components flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Header.jsx: extract auth-effect hook + controller-owned handlers](frontend/01-header-effect-hook-and-handlers.md)
- [02 — LoginModal.jsx: move handler bulk onto LoginModalController](frontend/02-loginmodal-controller-handlers.md)
- [03 — MyAccountHelper.jsx: FIELD_REGISTRY for the form fields](frontend/03-myaccount-field-registry.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Re-verify NLOC with `python3 -m lizard -l javascript -L 50 <file>` after each step — the goal is dropping each method back under 50, not a fixed shape.
- All 3 steps are pure "extract method/hook/registry" refactors — no rendered-output change is expected. Every existing spec listed per step must keep passing unmodified; only additive specs are expected.
- Independent of each other — can be implemented and reviewed as 3 separate small changes within this same issue/branch.
