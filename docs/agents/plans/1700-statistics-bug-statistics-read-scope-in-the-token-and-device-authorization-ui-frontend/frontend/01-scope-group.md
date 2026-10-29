# Statistics group in the scope helpers

Add `{ group: 'statistics', families: ['statistics'] }` as the **last** entry of `SCOPE_GROUPS`.
`groupScopes` already flags `write: false` when `statistics:write` is absent, and the picker row
already passes `available={family[action]}` to the checkbox, so the Write cell renders unavailable.
Check that the group header renders through its translation key, and that badges for owner and
staff token lists show `statistics:read`.

Specs: `groupScopes(['statistics:read'])` returns the statistics group last with `read: true,
write: false`; the picker renders the Statistics row with no usable Write checkbox when
`options.json` returns the scope, and no row when it does not; badges render the scope.

## Files to Change

- `frontend/assets/js/components/common/api_tokens/ApiTokenScopes.js` — new group.
- `frontend/specs/assets/js/components/common/api_tokens/ApiTokenScopesSpec.js` — group specs.
- `frontend/specs/assets/js/components/resources/account/pages/elements/` — picker and badge specs
  (`ApiTokenScopePicker*Spec`, `ApiTokensTable*Spec`), and the staff panel spec for
  `StaffUserApiTokensHelper`.
