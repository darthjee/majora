# Plan: Client: scaffold client/, docker-compose service and CI

Issue: [1607-client-scaffold-client-docker-compose-service-and-ci.md](../../issues/1607-client-scaffold-client-docker-compose-service-and-ci.md)

## Overview

Create the `client/` folder as the `majora-client` npm package (version `0.1.0`, ES modules,
Node 20 or later, dev dependencies only) with ESLint, Jasmine + c8, a placeholder module and spec,
and a README. Wire it into development (`majora_client` docker-compose service, `make client*`
targets) and CI (`client_tests`, `client_checks`, gating every app release job and
`coverage-final`), exactly as specified in
[`docs/agents/specs/client/packaging.md`](../../specs/client/packaging.md). Then update the docs
that still describe `client/` as not existing yet.

## Agents involved

- [infra](infra.md) — docker-compose service, `.gitignore`, Makefile targets, CircleCI jobs and gating
- [client](client.md) — everything under `client/`
- [architect](architect.md) — docs, agent files, `.codacy.yml`, markdownlint ignores

Suggested order: infra step 01 first (so `majora_client` exists for `yarn install`), then client,
then the rest of infra, then architect. Steps that only edit config can run in parallel.

## Shared contracts

### `majora_client` service (infra produces, client consumes)

```yaml
  majora_client:
    image: darthjee/node:0.2.1
    container_name: majora_client
    working_dir: /home/node/app
    volumes:
      - ./client:/home/node/app
      - ./docker_volumes/client_node_modules:/home/node/app/node_modules
    environment:
      - MAJORA_URL=${MAJORA_URL:-http://majora_proxy}
      - MAJORA_TOKEN=$MAJORA_TOKEN
      - MAJORA_GAME=$MAJORA_GAME
```

No `build`, `depends_on`, `ports` or `command`.

### `client/package.json` scripts (client produces, infra's Makefile and CI consume)

| Script | Does | Used by |
|---|---|---|
| `test` | `jasmine` (specs under `specs/`, `**/*[sS]pec.js`) | `make client-tests` |
| `lint` | `eslint src specs` | `make client-lint`, `client_checks` |
| `coverage` | `c8 jasmine`, lcov written to `client/coverage/lcov.info` | `make client-coverage`, `client_tests` |

- `client/yarn.lock` is committed and in sync, so `yarn install --frozen-lockfile` succeeds.
- `npm pack --dry-run` succeeds from `client/` and lists only `package.json`, `README.md` and
  files under `src/` (`bin/` is in `files` but does not exist yet).

### Make targets (infra produces, docs consume)

`client`, `client-install`, `client-tests`, `client-lint`, `client-coverage`, each a
`docker-compose run --rm majora_client ...` call as listed in the packaging spec.

### Ignored paths (infra and architect)

- `.gitignore`: `docker_volumes/client_node_modules/`, `client/node_modules/`, `client/coverage/`.
- `.markdownlint-cli2.jsonc` ignores: `client/node_modules/**`.
