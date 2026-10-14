# Issue: Client spec: write docs/agents/specs/client.md and its aspect pages

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records
the agreed design: scope, permission model, token lifecycle, client shape and token management
permissions.

Write the design spec for the client epic: a hub page plus seven aspect pages under
`docs/agents/specs/client/`. This is the epic's first sub-issue. Every later sub-issue
(#1594–#1613) builds on these files, so the file layout is fixed.

## Problem

The decisions made in #1592 live only in the epic's issue body. The improvement issues
(#1594–#1600) and the implementation issues (#1601–#1611) each need a stable spec page to read
and refine. Without one, every sub-issue would have to re-derive the design from the epic.

## Expected Behavior

- `docs/agents/specs/client.md`: the hub. It gives a short overview and links to each aspect
  page. Register it under "Active specs" in `docs/agents/specs.md`.
- `docs/agents/specs/client/tokens.md`: the `ApiToken` model (owner, name, hashed secret,
  non-secret prefix, scopes, optional list of games, optional expiry, last used), the
  `Authorization: Bearer mjr_<prefix>_<secret>` format, and the lifecycle. The lifecycle
  covers: the secret shown once; only the name editable; expired tokens rejected; immediate
  revocation; permanent auto-revoke when the owner's status leaves `approved`, including the
  staff deny flow.
- `docs/agents/specs/client/scopes.md`:
  - the scope catalogue (resource family × action);
  - the rule that a request needs both the owner's role and the token's scope to allow it;
  - the per-game restriction;
  - the endpoint families a token can never reach (token management, account data, staff
    endpoints);
  - uploads following the scope of the resource they attach to;
  - a survey of the existing views and the chosen enforcement mechanism. It must fail closed: an
    endpoint that declares no scope rejects scoped tokens.
- `docs/agents/specs/client/token-api.md`:
  - the owner endpoints, which accept a logged-in browser session only (create, list, rename,
    revoke);
  - the staff endpoints (list and revoke any user's tokens, metadata only);
  - access-control rules, `X-Skip-Cache: true`, and validation of the games list against the
    games the owner can reach;
  - how the PHP proxy and the Navi cache treat `Authorization: Bearer` requests, so a token
    request never gets a cached response that was not meant for it.
- `docs/agents/specs/client/token-ui.md`:
  - the frontend token management page (create form with the full scope catalogue and a games
    picker filtered to reachable games; the secret shown once; list with prefix, scopes, games,
    expiry and last used; rename; revoke);
  - the staff view on the staff user page;
  - use of `RequestStore` and `RequestPermissionResolvers`, and i18n.
- `docs/agents/specs/client/library.md`:
  - the Node library: plain JS with ES modules and JSDoc types, native `fetch`, Node 20 or
    later;
  - `new MajoraClient({ baseUrl, token })`, falling back to `MAJORA_URL` and
    `MAJORA_TOKEN`;
  - HTTP, auth, pagination and error handling;
  - the first set of resource wrappers (likely game content: characters, factions, documents,
    items).
- `docs/agents/specs/client/cli.md`: the thin CLI built on the library (commands, output format,
  configuration).
- `docs/agents/specs/client/packaging.md`:
  - the `client` docker-compose service (no host runtimes);
  - the CircleCI lint and test jobs;
  - a public npm release triggered when `client/package.json`'s version changes on `main`
    (the job fails if the version already exists);
  - the npm token stored in CircleCI's environment;
  - the package name, chosen after checking which names are free.

The spec must say that the top-level `client/` is unrelated to
`frontend/assets/js/client/`.

### Out of scope

Implementation. Changes to `crawler/` and the legacy DRF `Token`. Concrete automations.

### Acceptance criteria

- All eight files exist, and the hub is registered in `docs/agents/specs.md`.
- Each aspect page is detailed enough for the "improve spec" sub-issue for that file to start
  from it.
- Markdownlint passes, and every link resolves.

## Solution

- Every aspect page follows one template:
  - **Overview**
  - **Decisions**: everything already decided in epic #1592
  - **Open questions**
  - **Affected code**
- This issue writes down the decisions; it does not settle what is still open. Anything not yet
  decided goes in the page's **Open questions** section, and the matching improvement issue
  (#1594–#1600) settles it. In particular:
  - the survey of views and the choice of scope enforcement mechanism go to #1595;
  - the first set of resource wrappers goes to #1598;
  - the npm package name goes to #1600.
- No `product-owner`, `security` or `data-access` reviews here; they happen in the per-file
  improvement issues.

### Testing strategy

This issue only changes docs. Markdownlint must pass, and every link in the new pages and in
`docs/agents/specs.md` must resolve.

## Benefits

- Each later sub-issue reads one focused page instead of the whole epic.
- Open questions are written down per aspect, so #1594–#1600 have a clear to-do list.
- Ending with the permanent-docs issue (#1612) and the spec removal (#1613) follows the
  established spec workflow (`docs/agents/specs.md`).
