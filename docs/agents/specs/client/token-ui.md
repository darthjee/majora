# Token UI

The frontend pages where users manage their scoped tokens, and where staff review them. Part of
the [client spec](../client.md) (epic #1592). Refined by #1597 and implemented by #1605 (owner
page) and #1606 (staff view).

## Overview

The SPA gains a token management page for the logged-in user, and a tokens section on the staff
user page. Both talk to the [Token API](token-api.md) through a logged-in session.

## Decisions

### Owner token page

- **Create form.**
  - A name field.
  - A scope picker that shows the full scope catalogue (see [Scopes](scopes.md)).
  - A games picker that lists only games the user can reach (as DM, player or PC owner). The
    backend validates this too; the filter is not the only guard.
  - An expiry choice: 30 days, 90 days, a custom date, or never.
- **Secret shown once.** After creation, the full token is displayed once, with a clear warning
  that it cannot be shown again and a way to copy it.
- **List.** Each token shows its name, prefix, scopes, games, expiry and last used.
- **Rename.** Only the name can be edited.
- **Revoke.** Removes the token at once, after a confirmation.

### Staff view

- A tokens section on the staff user page lists the user's tokens (metadata only, never the
  secret) and lets staff revoke them, next to the existing recovery-token controls.

### Data access

- Token data is read through `RequestStore`, like other account data, following the
  `RequestPermissionResolvers` rules in
  [`issue-enhancement.md`](../../issue-enhancement.md).
- Token endpoints have a single private variant with `X-Skip-Cache: true` (see
  [Token API](token-api.md)).

### i18n

- Every label, message and warning goes through the translation files under
  `frontend/assets/i18n/`, with the same keys in every language.

## Open questions

Settled by #1597:

- The routes of the owner page and of the staff section.
- The navigation entry points (account menu, profile page, staff user page).
- How scopes are grouped in the picker (by resource family, with read/write/delete columns, or a
  flat list), and whether there are shortcuts such as "all read".
- How the games picker loads the reachable games.
- The components to add or reuse, and the frontend client calls.

## Affected code

- `frontend/assets/js/utils/requests/RequestStore.js` and
  `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`: how token data is read.
- `frontend/assets/js/client/`: the SPA's API clients, where the token calls go. This folder is
  unrelated to the new top-level `client/`.
- The staff user page components: the new tokens section.
- `frontend/assets/i18n/*.yaml`: new translation keys.
