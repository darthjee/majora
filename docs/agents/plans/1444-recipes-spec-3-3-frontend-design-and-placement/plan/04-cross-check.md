# Cross-check against the contract
Verify every URL, variant, permission flag, status code and field name used in `frontend.md`
exists in `recipes/api-contract.md` (routes, `can_create_recipe`, `can_exchange_recipe`,
`can_edit`, masked `output: null`, shortlist URLs). Fix mismatches in `frontend.md`; only touch
the contract page for a clear omission, noting it in the commit.

## Files to Change
- `docs/agents/specs/recipes/frontend.md` — corrections, if any.
- `docs/agents/specs/recipes/api-contract.md` — only for a clear omission.
