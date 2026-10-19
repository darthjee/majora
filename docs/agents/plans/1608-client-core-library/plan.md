# Plan: Client: core library

Issue: [1608-client-core-library.md](../../issues/1608-client-core-library.md)

## Overview
Implement the generic core of the `majora-client` Node.js library under `client/src/core/`:
configuration, the shared HTTP layer (Bearer auth, JSON and multipart bodies, timeouts, GET-only
retries), pagination (`Page` / `Paginator`) and the typed error hierarchy, plus `MajoraClient`
and the public `src/index.js`. All work is inside `client/`, owned by the `client` agent.

See [client.md](client.md) for the full plan.
