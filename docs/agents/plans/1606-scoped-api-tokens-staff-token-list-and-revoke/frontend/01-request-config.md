# Request config and client cache

Add the staff token endpoints to the `staffUser` resource, mirroring `recoveryTokens` / `deleteRecoveryToken`:

- `apiTokens`: path `({ id }) => /staff/users/${id}/api-tokens.json`, `permission: null`, registered as `GET.apiTokens` (`regular` and `private` pointing at the same object).
- `deleteApiToken`: path `({ id, tokenId }) => /staff/users/${id}/api-tokens/${tokenId}.json`, `permission: null`, registered as `DELETE.deleteApiToken`.
- Extend the file's doc comment with a paragraph for issue #1606, like the #1248/#1249 ones.

Make sure the list never comes from the client cache: add `'/api-tokens.json'` to `skipCacheSuffixes.js`, with a comment saying a user's scoped token metadata is private, staff-only data (issue #1606). The DELETE is a mutation and is not cached anyway.

Specs: extend the `staffUserConfig` / `resourceConfig` spec with the two new entries (paths built from `{ id, tokenId }`, `permission: null`, same `regular`/`private` object), and the skip-cache spec with the new suffix.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffUserConfig.js` — `GET.apiTokens`, `DELETE.deleteApiToken` and the doc comment.
- `frontend/assets/js/client/config/skipCacheSuffixes.js` — the `/api-tokens.json` suffix.
- The matching specs under `frontend/specs/` (the existing `staffUserConfig` and skip-cache specs).
