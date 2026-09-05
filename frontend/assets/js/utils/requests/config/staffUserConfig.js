/**
 * GET/mutation resource configuration for `staffUser` (issue #842) — the first `resourceConfig`
 * entry for this resource, covering the staff-only user management list/detail/update/
 * recovery-link endpoints.
 *
 * @description Every endpoint here is staff/superuser-only, gated client-side by the page
 *   controllers' own `AccessStore.ensureStaffOrSuperUser()` before ever calling through, enforced
 *   server-side too; none has a separate restricted/full variant, so every `regular`/`private`
 *   pair below points at the exact same object, mirroring `sessionConfig.js`'s `single` shape.
 *   Unlike every other resource configured so far, no param here is `gameSlug`-scoped.
 *
 *   `GET.collection` (`fetchUsers`, `/staff/users.json`) and `GET.single`/`PATCH.single`
 *   (`fetchUser`/`updateUser`, `/staff/users/:id.json`) mirror `StaffUserClient`'s former methods
 *   of the same name — `GET.single` is also still used directly by `StaffUserController.js`'s
 *   own (out-of-scope-for-#842) user detail page.
 *
 *   `POST.recoveryLink` (`fetchRecoveryLink`, `/staff/users/:id/recovery-link.json`) gets its own
 *   quantity-type key rather than being forced into `single` — despite its `fetch`-prefixed name
 *   it is a real mutation (creates/reuses a `PasswordResetToken` server-side), mirroring
 *   `treasureConfig.js`'s `acquire`/`buy`/`remove`/`sell`/`link`-style sub-resource keys.
 *
 *   `GET.recoveryTokens` (issue #1248, `/staff/users/:id/recovery-tokens.json`) lists every
 *   `PasswordResetToken` row owned by the user, mirroring `collection`/`single`'s shape rather
 *   than `recoveryLink`'s — it is a read-only listing, not a mutation.
 *
 *   `POST.approve`/`POST.deny` (issue #859, `/staff/users/approve.json`/`/staff/users/deny.json`)
 *   have no dynamic path segment — the target user id travels in the request body (`{user_id}`)
 *   instead, unlike every other quantity type here.
 *
 *   `POST.unexpireRecoveryToken`/`POST.forceExpireRecoveryToken`/`DELETE.deleteRecoveryToken`
 *   (issue #1249, `/staff/users/:id/recovery-tokens/:tokenId/unexpire.json`,
 *   `/staff/users/:id/recovery-tokens/:tokenId/force-expire.json` and
 *   `/staff/users/:id/recovery-tokens/:tokenId.json`) are the row-level mutation actions on a
 *   single `PasswordResetToken`, each keyed by both `id` (user) and `tokenId`; none returns any
 *   token data, so callers must re-fetch `GET.recoveryTokens` on success. `DELETE` is a brand-new
 *   top-level key on this resource.
 */
const collection = { path: () => '/staff/users.json', permission: null };
const single = { path: ({ id }) => `/staff/users/${id}.json`, permission: null };
const recoveryLink = { path: ({ id }) => `/staff/users/${id}/recovery-link.json`, permission: null };
const recoveryTokens = { path: ({ id }) => `/staff/users/${id}/recovery-tokens.json`, permission: null };
const approve = { path: () => '/staff/users/approve.json', permission: null };
const deny = { path: () => '/staff/users/deny.json', permission: null };
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

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
    recoveryTokens: { regular: recoveryTokens, private: recoveryTokens },
  },
  PATCH: {
    single: { regular: single, private: single },
  },
  POST: {
    recoveryLink: { regular: recoveryLink, private: recoveryLink },
    approve: { regular: approve, private: approve },
    deny: { regular: deny, private: deny },
    unexpireRecoveryToken: { regular: unexpireRecoveryToken, private: unexpireRecoveryToken },
    forceExpireRecoveryToken: { regular: forceExpireRecoveryToken, private: forceExpireRecoveryToken },
  },
  DELETE: {
    deleteRecoveryToken: { regular: deleteRecoveryToken, private: deleteRecoveryToken },
  },
};
