# Client

Design spec for epic #1592: a Node.js client for Majora, living in a new top-level `client/`
folder, so automations (for example an AI that generates campaign content) can use the Majora
API through fine-grained, scoped API tokens.

The epic has three parts:

- **Token management.** Users create, list, rename and revoke scoped API tokens from a logged-in
  browser session. Staff can list and revoke any user's tokens.
- **Token authentication.** The API accepts the new scoped tokens and enforces each token's
  scopes on every request, on top of what the owner can already do.
- **Node client (`client/`).** A generic core (authentication, HTTP, pagination, errors), a
  first set of resource wrappers, a thin CLI, and a public npm package.

## Scope

### In scope

- The `ApiToken` model, Bearer authentication, expiry, last-used tracking and auto-revoke.
- Scope enforcement across the existing views, failing closed.
- Owner and staff token management endpoints, and their frontend pages.
- The `client/` library, its CLI, its docker-compose service, its CI jobs and its npm release.

### Out of scope

- **`crawler/` and the legacy DRF `Token`.** Both stay unchanged. `crawler/` keeps using the
  all-access `Authorization: Token <key>` (see [`crawler.md`](../crawler.md)). Moving the
  crawler onto `client/` and scoped tokens is possible follow-up work outside this epic.
- **Concrete automations**, such as the AI content generator. This epic delivers the client and
  the tokens that make automations possible, not the automations themselves.
- **Full API coverage** in the client. The first set of resources is picked in
  [`library.md`](client/library.md).

### Naming

The new top-level `client/` folder is **unrelated** to the existing
`frontend/assets/js/client/` folder, which holds the SPA's own API clients (`BaseClient`,
`GameClient`, ...). The two share no code and no owner.

## Aspect pages

- [Tokens](client/tokens.md): the `ApiToken` model, hashing, the `Bearer mjr_` format, the
  lifecycle and auto-revoke.
- [Scopes](client/scopes.md): the scope catalogue (`read`/`write` per resource family),
  intersection with the owner's roles, the per-game restriction, the exclusions and the
  enforcement mechanism (the per-view `@token_scopes` declaration, failing closed).
- [Token API](client/token-api.md): owner and staff token endpoints (including `options.json`,
  the scope catalogue and reachable games for the create form), access control, `X-Skip-Cache`,
  and how the proxy and the cache treat Bearer requests. #1597 amended it with the
  reachable-game definition and `options.json`.
- [Token UI](client/token-ui.md): the frontend token management page and the "API tokens"
  panel on the staff user page, both reading token data through `RequestStore`.
- [Library](client/library.md): the client core (configuration, HTTP, auth, pagination, errors,
  retries and timeouts), the module layout and the first resource wrappers. #1598 settled the
  library's API surface and split the wrapper work into #1609, #1621, #1622 and #1623.
- [CLI](client/cli.md): the thin CLI on top of the library.
- [Packaging](client/packaging.md): the docker-compose service, CI, the npm release and the
  package name.

Every aspect page follows the same template: **Overview**, **Decisions** (what epic #1592
already settled), **Open questions** (each naming the improvement issue that settles it) and
**Affected code**.

## Sub-issues

| # | Issue | Sub-issue | Page | Agent |
|---|---|---|---|---|
| 1 | #1593 | Write the client spec (this hub and the 7 aspect pages) | all | architect |
| 2 | #1594 | Improve spec: `tokens.md` | [Tokens](client/tokens.md) | architect |
| 3 | #1595 | Improve spec: `scopes.md` | [Scopes](client/scopes.md) | architect |
| 4 | #1596 | Improve spec: `token-api.md` | [Token API](client/token-api.md) | architect |
| 5 | #1597 | Improve spec: `token-ui.md` | [Token UI](client/token-ui.md) | architect |
| 6 | #1598 | Improve spec: `library.md` | [Library](client/library.md) | architect |
| 7 | #1599 | Improve spec: `cli.md` | [CLI](client/cli.md) | architect |
| 8 | #1600 | Improve spec: `packaging.md` | [Packaging](client/packaging.md) | architect |
| 9 | #1601 | Add the `client` specialist agent (owns `client/`) | all | architect |
| 10 | #1602 | `ApiToken` model, Bearer auth, expiry, last-used, auto-revoke | [Tokens](client/tokens.md) | backend |
| 11 | #1603 | Scope enforcement across views (fail closed) | [Scopes](client/scopes.md) | backend |
| 12 | #1604 | Owner and staff token management endpoints | [Token API](client/token-api.md) | backend |
| 13 | #1605 | Frontend token management page | [Token UI](client/token-ui.md) | frontend, translator |
| 14 | #1606 | Staff token list and revoke on the staff user page | [Token UI](client/token-ui.md) | frontend, translator |
| 15 | #1607 | `client/` scaffold, docker-compose service, CI lint and test | [Packaging](client/packaging.md) | infra, client |
| 16 | #1608 | Client core library | [Library](client/library.md) | client |
| 17 | #1609 | First resource wrappers (plain resources) | [Library](client/library.md) | client |
| 18 | #1610 | CLI | [CLI](client/cli.md) | client |
| 19 | #1611 | npm release job | [Packaging](client/packaging.md) | infra |
| 20 | #1612 | Update the permanent docs before removing the specs | all | architect |
| 21 | #1613 | Remove the client spec files | all | architect |
| 22 | #1621 | Document page wrappers | [Library](client/library.md) | client |
| 23 | #1622 | Link route wrappers | [Library](client/library.md) | client |
| 24 | #1623 | Photo upload wrappers | [Library](client/library.md) | client |

Sub-issues 11 and 12 also get `security` and `data-access` reviews. Improvement issues 2 to 8 are one
per aspect page; any that turns out to need no work is closed.

### Order

1. The spec: #1593, then the improvements #1594–#1600, then the agent #1601.
2. The backend track: #1602, then #1603, then #1604. #1616 (plain routes never serve hidden
   content) must land before #1603 (see [Read scopes](client/scopes.md#read-scopes)). The
   frontend issue #1605 needs #1604, and #1606 needs both #1604 and #1605 (it reuses the shared
   `ApiTokenRevokeConfirmModal` and token row cells).
3. The client track: #1607, then #1608, then #1609 and #1610 in parallel. #1621 and #1622 come
   after #1609; #1623 comes after #1608 and #1609. #1611 comes after #1608. This track can run
   alongside the backend track.
4. Last: the permanent docs (#1612), then the spec removal (#1613).

## Lifecycle of this spec

This spec is temporary, following the workflow in [`specs.md`](../specs.md). Once every
implementation issue is done, #1612 moves what these pages record into the permanent docs under
`docs/agents/` and `docs/guides/`, and #1613 deletes `docs/agents/specs/client.md` and
`docs/agents/specs/client/` and unregisters them from `specs.md`.
