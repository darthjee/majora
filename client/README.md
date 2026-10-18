# majora-client

Node.js library and command-line client for the [Majora](https://github.com/darthjee/majora)
RPG campaign manager API, meant for automations.

> **Under construction.** This package is being built as part of epic #1592. The current
> release only contains a placeholder module; the library and the `majora` CLI come in later
> sub-issues.

## Overview

- Authenticates with **scoped API tokens** (`Authorization: Bearer mjr_...`), never with the
  legacy all-access token.
- Talks to the API over **HTTPS only**, unless insecure HTTP is explicitly allowed.
- Requires **Node.js 20 or later** (native `fetch`, `AbortSignal.any`, `util.parseArgs`).
- Has **no runtime dependencies**.

## Development

No Node.js runtime is needed on the host: everything runs in the `majora_client`
docker-compose service, from the repository root.

```bash
make client-install    # install dev dependencies (once, and after dependency changes)
make client-tests      # run the Jasmine specs
make client-lint       # run ESLint
make client-coverage   # run the specs with c8 coverage (lcov in client/coverage/)
make client            # open a shell in the majora_client container
```

## Documentation

See the [client spec](../docs/agents/specs/client.md) and its aspect pages under
`docs/agents/specs/client/`.

## License

MIT
