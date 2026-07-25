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
 */
const collection = { path: () => '/staff/users.json', permission: null };
const single = { path: ({ id }) => `/staff/users/${id}.json`, permission: null };
const recoveryLink = { path: ({ id }) => `/staff/users/${id}/recovery-link.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
  PATCH: {
    single: { regular: single, private: single },
  },
  POST: {
    recoveryLink: { regular: recoveryLink, private: recoveryLink },
  },
};
