# Issue: Client: update the permanent docs before removing the specs

## Description
Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The client spec (`docs/agents/specs/client.md` and the 7 aspect pages under `docs/agents/specs/client/`) is temporary, per [`specs.md`](../specs.md). Before #1613 deletes it, every long-lived fact it records must move into permanent docs, described as actually implemented (the code is the source of truth where the spec and code differ).

## Problem
- Several permanent docs still point at the spec: `docs/agents/client.md`, `docs/agents/access-control/api-token.md`, `docs/agents/access-control/endpoints.md`, `docs/agents/contributing.md`, `client/README.md` and `.claude/agents/client.md`.
- The consumer-facing `docs/guides/majora.md` still only describes the legacy `Authorization: Token` header, with no mention of scoped `Bearer mjr_` tokens.
- The design of the still-open wrapper issues #1621 (document pages), #1622 (link routes) and #1623 (photo uploads) exists only in the spec's `library.md`.

## Expected Behavior
- Every fact still needed from the spec lives in a permanent doc or, for unimplemented wrappers, in the body of its open issue, so #1613 can delete the spec without losing information.
- No permanent doc, agent definition (`.claude/agents/`) or README links to `docs/agents/specs/client*`.

## Solution
### Agent-facing docs (`docs/agents/`)
- **Client:** keep `docs/agents/client.md` as the hub (why it exists, ownership, naming) and add `docs/agents/client/library.md`, `docs/agents/client/cli.md` and `docs/agents/client/packaging.md`, covering what is implemented: configuration and transport security, module layout, pagination, errors, retries and timeouts, the implemented resource wrappers, the CLI grammar, output, flags and exit codes, and the docker-compose service, Makefile targets, CI jobs, release and versioning. Replace the "Lifecycle" section of `client.md` that points at the spec.
- **Tokens and scopes:** extend `docs/agents/access-control/api-token.md` with the token model (format, hashing, expiry, last-used, auto-revoke) and the reachable-game definition, and add a new `docs/agents/access-control/token-scopes.md` for the scope catalogue, intersection with the owner's roles, the per-game restriction, uploads, exclusions, the per-view `@token_scopes` declaration and fail-closed enforcement. Register it in `access-control.md`.
- **Proxy and cache:** move the Bearer-request handling (Bearer detection, proxy bypass, backend safety net, Navi) into the existing proxy/cache docs (`architecture/proxy.md`, `no-private-cache-routes.md` and/or `cache-warmer.md`).
- **Security:** move secret handling, logging, audit, CSRF and HTTPS-only transport into `docs/agents/security-guidelines/`.
- **Token UI:** add a page under `docs/agents/frontend/` for the owner token page and the staff "API tokens" panel (routes, components, `RequestStore` data access, error mapping, i18n), registered in `frontend.md`.
- **Permissions:** update `docs/agents/permissions.yaml` only if token management adds a role/scope row worth recording.

### Consumer guide (`docs/guides/`)
- Add a new hub `docs/guides/client.md` (with pages under `docs/guides/client/` if it grows): how to create a token in the UI, the available scopes and per-game restriction, installing `majora-client` from npm, library usage and CLI usage.
- Rewrite the Authentication section of `docs/guides/majora.md` to describe scoped `Authorization: Bearer mjr_...` tokens alongside the legacy `Token` header (still used by the crawler), and link the client guide. Link the guide from the relevant hubs (`docs/guides/majora.md`, `docs/agents/client.md`, `client/README.md`).

### Open wrapper issues
- Copy the pending design for the document page, link route and photo upload wrappers from `library.md` into the bodies of #1621, #1622 and #1623, so each issue is self-contained once the spec is gone. The permanent docs describe only what is implemented; each wrapper issue updates `docs/agents/client/library.md` and the consumer guide when it lands.

### Links and cleanup
- Repoint every link to the spec files: `docs/agents/client.md`, `access-control/api-token.md`, `access-control/endpoints.md`, `contributing.md`, `client/README.md` and `.claude/agents/client.md`.
- Leave `docs/agents/specs.md` and the spec files themselves for #1613.
- Drop spec-only material: sub-issue tables, ordering, open questions, "Rejected" alternatives and testing plans for completed issues.

## Benefits
- #1613 can delete the spec safely.
- Automation authors get a real guide for creating tokens and using the client.
- Agents and the open wrapper issues no longer depend on a temporary doc.
