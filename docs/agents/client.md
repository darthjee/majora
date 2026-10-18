# Client Agent

## Why it exists

Epic #1592 adds a Node.js Majora client so automations can use the Majora API with
fine-grained API tokens. The `client` specialist agent (`.claude/agents/client.md`) owns the
top-level `client/` folder, which holds that client: the library, its CLI and the public npm
package `majora-client`. `client/` was scaffolded by #1607.

## Relationship to the API and tokens

The client authenticates with scoped `Authorization: Bearer mjr_...` tokens (see
[tokens](specs/client/tokens.md) and [scopes](specs/client/scopes.md)). The server enforces
each token's scopes on top of the owner's own access, so a token can never do more than its
owner. Request and response shapes come from the API guides under
[`docs/guides/majora/`](../guides/majora.md).

The [crawler](crawler.md) is unchanged: `crawler/` still uses the legacy all-access
`Authorization: Token <key>` header.

## Ownership boundaries

- **`client`** owns everything inside `client/`: `src/` (library and `src/cli/`), `bin/`,
  `specs/`, `eslint.config.mjs`, `package.json`, `yarn.lock` and `README.md`.
- **`infra`** keeps the wiring outside it: the `majora_client` docker-compose service, the
  `client*` Makefile targets, the `client_tests`, `client_checks` and `client-release` CI jobs,
  and `scripts/bump_version.sh client` (see [packaging](specs/client/packaging.md)).

## Naming

`client/` is unrelated to `frontend/assets/js/client/` (the SPA API clients `BaseClient`,
`GameClient`, ...). That folder stays with the `frontend` agent, and the two share no code.

## Lifecycle

The [client spec](specs/client.md) is the current source of truth. #1612 moves this reference
into permanent docs (and repoints the agent) before #1613 removes the spec.
