# Plan: Client: update the permanent docs before removing the specs

Issue: [1612-client-update-the-permanent-docs-before-removing-the-specs.md](../../issues/1612-client-update-the-permanent-docs-before-removing-the-specs.md)

## Overview

Move every long-lived fact from the client spec (`docs/agents/specs/client.md` and
`docs/agents/specs/client/*.md`) into permanent docs, as implemented, so #1613 can delete the
spec. Add a consumer guide under `docs/guides/`, move the pending wrapper designs into the bodies
of #1621, #1622 and #1623, and repoint every link to the spec.

## Context

- The spec is temporary per [`specs.md`](../../specs.md). All implementation issues are closed
  except the wrapper issues #1621 (document pages), #1622 (link routes) and #1623 (photo
  uploads), and the spec removal #1613.
- Where the spec and the code disagree, the code wins: document what is implemented. For
  example, the spec's `library.md` status line still says the wrappers are not implemented,
  but #1609 shipped the plain resource wrappers (`client/src/resources/`).
- Some content already lives in permanent docs and only needs checking:
  `docs/agents/access-control/api-token.md` (who manages tokens),
  `docs/agents/architecture/proxy.md` (`BearerSkipCacheMiddleware`),
  `docs/agents/no-private-cache-routes.md`, `docs/agents/cache-warmer.md` (Navi never sends a
  Bearer token) and `client/README.md` (library and CLI usage).
- This is a docs-only, cross-cutting change owned by the architect. No code changes.

## Steps

- [01 — Client agent docs](plan/01-client-agent-docs.md)
- [02 — Token and scope access-control docs](plan/02-token-and-scope-docs.md)
- [03 — Proxy, cache and security docs](plan/03-proxy-cache-security-docs.md)
- [04 — Token UI frontend doc](plan/04-token-ui-frontend-doc.md)
- [05 — Consumer guide](plan/05-consumer-guide.md)
- [06 — Move pending wrapper designs into their issues](plan/06-wrapper-issue-bodies.md)
- [07 — Repoint links and final sweep](plan/07-repoint-links-and-sweep.md)

## Notes

- Follow [`docs/agents/documentation.md`](../../documentation.md): blank lines around every
  heading and list (Codacy lints Markdown on the PR; there is no local check).
- Drop spec-only material: sub-issue tables, ordering, open questions, "Rejected" alternatives,
  "Implementation split" sections and testing plans for completed issues. Keep the reasons
  behind decisions when they still explain the code (for example, why HTTPS is enforced).
- Do not delete the spec files or unregister them from `docs/agents/specs.md`; that is #1613.
- `client/README.md` belongs to the `client` agent and `docs/agents/cache-warmer.md` to the
  `cache` agent. The changes there are link repoints or small additions, so the architect makes
  them directly. Delegate only if a change grows beyond that.
- Read each spec page against the code before moving it (`backend/accounts/` for tokens and
  scopes, `client/src/` for the library and CLI, `frontend/assets/js/components/resources/account/`
  and `.../staff_user/` for the UI, `.circleci/config.yml`, `Makefile`, `scripts/` for packaging).
