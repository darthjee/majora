# Plan: Client spec: write docs/agents/specs/client.md and its aspect pages

Issue: [1593-client-spec-write-docs-agents-specs-client-md-and-its-aspect-pages.md](../../issues/1593-client-spec-write-docs-agents-specs-client-md-and-its-aspect-pages.md)

## Overview

Write the design spec for epic #1592: a hub page `docs/agents/specs/client.md` plus seven aspect
pages under `docs/agents/specs/client/`. Register the hub in `docs/agents/specs.md`. This issue
only changes docs. It records the epic's decisions and lists everything still undecided as
**Open questions**, for the per-file improvement issues #1594–#1600 to settle.

## Context

- The spec workflow lives in `docs/agents/specs.md`. Every spec registers there only, never in
  `AGENTS.md`.
- Precedent: `docs/agents/specs/loot-crawling.md`, a hub that links to aspect pages in
  `docs/agents/specs/loot-crawling/`.
- The epic's decisions: scoped `ApiToken` tokens sent as `Authorization: Bearer
  mjr_<prefix>_<secret>`; a request needs both the owner's role and the token's scope to allow
  it; resource × action scopes; an optional list of games; endpoint families tokens can never
  reach; the token lifecycle; a Node library plus thin CLI published to npm.
- Relevant existing code and docs, to reference from "Affected code":
  - `backend/accounts/authentication.py` (`CookieTokenAuthentication`)
  - `docs/agents/access-control/` (especially `user.md`, for the recovery-token precedent and
    the deny flow)
  - `docs/agents/permissions.yaml`
  - `docs/agents/no-private-cache-routes.md`
  - `docs/agents/cache-warmer.md`
  - `docs/agents/pagination.md`
  - `frontend/assets/js/utils/requests/RequestStore.js` and `RequestPermissionResolvers.js`
  - `crawler/` and `docs/agents/crawler.md`
  - `.circleci/config.yml`
  - `docker-compose.yml`

### Page template

Every aspect page uses the same sections, in this order:

1. `# <Title>` plus a one-paragraph intro naming epic #1592 and the sub-issues the page drives.
2. `## Overview`
3. `## Decisions`: everything already settled in #1592, stated as facts.
4. `## Open questions`: a bullet list, each naming the improvement issue that settles it.
5. `## Affected code`: existing files and folders the aspect touches or extends.

## Steps

- [01 — Hub page and registration](plan/01-hub-and-registration.md)
- [02 — Token aspect pages](plan/02-token-pages.md)
- [03 — Client aspect pages](plan/03-client-pages.md)
- [04 — Lint and link check](plan/04-lint-and-links.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`, `yarn lint_md`)

## Notes

- Do not decide anything that belongs to an improvement issue. In particular, leave as open
  questions: the scope enforcement mechanism (#1595), the first resource set (#1598) and the npm
  package name (#1600).
- The top-level `client/` is unrelated to `frontend/assets/js/client/`. Say so in the hub and in
  `library.md`.
- `crawler/` and the legacy DRF `Token` are out of scope and unchanged. Mention them only as
  context.
