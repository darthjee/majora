# Revisit accounts users/ vs account/ url prefix convention

## Context

The `accounts` app's `authorization_requests` endpoints currently mix two URL
prefixes without a documented rationale:

- `users/authorization_requests.json` (create) and
  `users/authorization_requests/<uuid>.json` (poll) use the `users/` prefix.
- `account/authorization_requests.json` (list),
  `account/authorization_requests/<uuid>/deny.json` (deny), and
  `account/authorization_requests/<uuid>/authorize.json` (authorize) use the
  `account/` prefix.

This split was noticed while reorganizing `accounts/urls.py` into a
per-resource `accounts/urls/` package (issue #1022, "Reorganize endpoints and
modules"). That reorg was kept as a pure structural move — it preserves
existing paths as-is — so this prefix inconsistency was deliberately deferred
to this follow-up issue rather than decided as part of #1022.

It's unclear whether the split is intentional (e.g. `users/*` for
self-service actions performed by the requesting user themselves — create and
poll their own authorization request — versus `account/*` for actions a
target account holder takes on someone else's request — list, approve, deny)
or whether it's just historical drift that should be unified under a single
prefix.

## What needs to be done

- Backend: review every route currently under `accounts/urls/` (not just
  `authorization_requests.py`) to confirm whether `users/*` vs `account/*` is
  used consistently elsewhere, and decide on a convention:
  - Either document `users/*` (self-service on your own request) vs
    `account/*` (actions on another user's request) as the intentional
    convention and keep the split as-is, or
  - Unify all `authorization_requests` routes under a single prefix
    (`users/authorization_requests...` or `account/authorization_requests...`,
    pick one) and rename accordingly.
- Backend: if a rename is decided, update:
  - `backend/accounts/urls/authorization_requests.py` (route paths and
    `name=` values)
  - any tests referencing the old paths/URL names (e.g. under
    `backend/accounts/tests/`)
  - any other backend code (e.g. redirects, docs strings) referencing the old
    paths
- Frontend: if a rename is decided, update any frontend API client calls that
  hit these endpoints, and their specs.
- Cache: if a rename is decided, update `navi/navi_config.yaml` /
  `navi/resources/*.yml` warm-up entries referencing the renamed paths.
- Docs: record the final decision (and rationale) in `docs/agents/` — either
  as a documented convention in `docs/agents/architecture.md` (if the split is
  kept) or reflected in `docs/agents/access-control/` and any endpoint tables
  that reference these routes (if renamed).

## Acceptance criteria

- [ ] A decision is made and documented on whether `users/*` and `account/*`
      prefixes for `authorization_requests` endpoints are unified under one
      prefix, or intentionally kept split.
- [ ] If unified: `backend/accounts/urls/authorization_requests.py`, its
      views/tests, and any frontend callers/specs are updated to the new
      paths, with no remaining references to the old paths.
- [ ] If kept split: the rationale (self-service vs. target-user actions, or
      otherwise) is documented in `docs/agents/`.
- [ ] Existing `authorization_requests` functionality (create, poll, list,
      approve, deny) continues to work end-to-end after the change.
