# Client Agent

## Why it exists

Epic #1592 adds a Node.js Majora client so automations (for example an AI that generates
campaign content) can use the Majora API with fine-grained API tokens. The `client` specialist
agent (`.claude/agents/client.md`) owns the top-level `client/` folder, which holds that client:
the library, its CLI and the public npm package `majora-client`.

The client covers a first set of resources, not the whole API (see
[library](client/library.md#resource-wrappers)). Concrete automations are built on top of it and
live outside this repository.

## Relationship to the API and tokens

The client authenticates with scoped `Authorization: Bearer mjr_...` tokens (see
[ApiToken](access-control/api-token.md) and [Token scopes](access-control/token-scopes.md)).
The server enforces each token's scopes on top of the owner's own access, so a token can never
do more than its owner. Request and response shapes come from the API guides under
[`docs/guides/majora/`](../guides/majora.md).

The [crawler](crawler.md) is unchanged: `crawler/` still uses the legacy all-access
`Authorization: Token <key>` header. Moving it onto `client/` and scoped tokens is possible
follow-up work.

## Ownership boundaries

- **`client`** owns everything inside `client/`: `src/` (library and `src/cli/`), `bin/`,
  `specs/`, `eslint.config.mjs`, `package.json`, `yarn.lock` and `README.md`.
- **`infra`** keeps the wiring outside it: the `majora_client` docker-compose service, the
  `client*` Makefile targets, the `client_tests`, `client_checks` and `client-release` CI jobs,
  `scripts/bump_version.sh client` and `scripts/release_client.sh` (see
  [packaging](client/packaging.md) and the release process in
  [Releasing the client](contributing.md#releasing-the-client)).

## Naming

`client/` is unrelated to `frontend/assets/js/client/` (the SPA API clients `BaseClient`,
`GameClient`, ...). That folder stays with the `frontend` agent, and the two share no code.

## Pages

- [Library](client/library.md): runtime, configuration and HTTPS-only transport, module
  layout, pagination, errors, retries and timeouts, the resource wrappers and testing.
- [CLI](client/cli.md): command grammar, flags, output, exit codes and the `src/cli/` layout.
- [Packaging](client/packaging.md): the npm package, the `majora_client` service, the Makefile
  targets, CI, release and versioning.
- [Consumer guide](../guides/client.md): creating a token and using the client, for automation
  authors.
- [`client/README.md`](../../client/README.md): the npm-facing usage reference.
