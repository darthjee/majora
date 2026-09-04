# staffUserConfig.js: GET.recoveryTokens

Add a new `GET.recoveryTokens` entry to `staffUserConfig.js`, mirroring `collection`/`single` (not `recoveryLink`, which is a `POST` mutation): a path object with `regular`/`private` pointing at the same value, `permission: null` (no `RequestPermissionResolvers` entry for `staffUser`, issue #842).

```js
const recoveryTokens = {
  path: ({ id }) => `/staff/users/${id}/recovery-tokens.json`,
  permission: null,
};
```

Add it under `GET`:

```js
GET: {
  collection: { regular: collection, private: collection },
  single: { regular: single, private: single },
  recoveryTokens: { regular: recoveryTokens, private: recoveryTokens },
},
```

Update the file's top JSDoc description to mention the new entry, following the existing style that documents each quantity-type key's origin/rationale.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffUserConfig.js` — add the `recoveryTokens` path object and `GET.recoveryTokens` entry.
