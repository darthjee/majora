# Keep statistics out of "Select all"

`ApiTokenScopeSelection.selectAll` adds every catalogue scope with the given action. Exclude the
staff-only scopes (`statistics:read`), so the sensitive scope can only be ticked on purpose. Keep
the exclusion list in `ApiTokenScopes` (e.g. `EXPLICIT_ONLY = ['statistics:read']`) next to the
groups. Toggling the checkbox directly and "Clear" are unchanged.

Specs: "Select all read" and "Select all write" leave `statistics:read` unticked (and keep it
ticked if it already was); toggling it directly works.

## Files to Change

- `frontend/assets/js/components/common/api_tokens/ApiTokenScopes.js` — explicit-only list.
- `frontend/assets/js/components/resources/account/pages/elements/ApiTokenScopeSelection.js` —
  skip explicit-only scopes in `selectAll`.
- `frontend/specs/assets/js/components/resources/account/pages/elements/ApiTokenScopeSelectionSpec.js`
  — select-all specs.
