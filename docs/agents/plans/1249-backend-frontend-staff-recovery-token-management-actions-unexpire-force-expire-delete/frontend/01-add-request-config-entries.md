# Add request-config entries

Add three new quantity-type entries to the `staffUser` resource in `staffUserConfig.js`, path
builders keyed by both `id` (user) and `tokenId`, mirroring `recoveryLink`/`recoveryTokens`'s
existing `{ path, permission: null }` shape (no `RequestPermissionResolvers` entry, no
`variantName` — single variant, same `regular`/`private` pointing at the same object):

```js
const unexpireRecoveryToken = {
  path: ({ id, tokenId }) => `/staff/users/${id}/recovery-tokens/${tokenId}/unexpire.json`,
  permission: null,
};
const forceExpireRecoveryToken = {
  path: ({ id, tokenId }) => `/staff/users/${id}/recovery-tokens/${tokenId}/force-expire.json`,
  permission: null,
};
const deleteRecoveryToken = {
  path: ({ id, tokenId }) => `/staff/users/${id}/recovery-tokens/${tokenId}.json`,
  permission: null,
};
```

Wire them into the exported config: `POST.unexpireRecoveryToken`, `POST.forceExpireRecoveryToken`,
`DELETE.deleteRecoveryToken` (a brand-new `DELETE` top-level key on this resource — there isn't
one yet). Update the file's top-of-file JSDoc description block to document the three new entries
the same way the existing `recoveryLink`/`recoveryTokens` entries are documented, including the
issue number.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffUserConfig.js` — add the three path objects and
  wire them into `POST`/`DELETE`, update the file-level JSDoc.
