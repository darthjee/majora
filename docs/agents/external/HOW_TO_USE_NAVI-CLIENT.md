# How to Use navi-hey-client

[`navi-hey-client`](https://www.npmjs.com/package/navi-hey-client) is a thin Node.js client (library + CLI) for [Navi](https://github.com/darthjee/navi)'s token-secured `/api/*` HTTP namespace.

Navi's `/api/*` namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`) allows external, programmatic control of an already-running Navi instance — pushing configuration in, starting a warming run, or stopping one — without hand-rolling requests and bearer-token handling yourself.

This guide is intended for developers and AI agents who want to control a running Navi instance from their own Node.js code, CI pipelines, or the command line.

---

## Table of Contents

- [Installation](./navi-client/installation.md) — installing `navi-hey-client` from npm.
- [Library Usage](./navi-client/library-usage.md) — using the `NaviClient` class in your own code.
- [CLI Usage](./navi-client/cli-usage.md) — using the `navi-client` command line tool.
- [Reference](./navi-client/reference.md) — the underlying `/api/*` HTTP namespace and error handling.
