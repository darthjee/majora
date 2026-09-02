# How to Use navi-hey-client

[`navi-hey-client`](https://www.npmjs.com/package/navi-hey-client) is a thin Node.js client (library + CLI) for [Navi](https://github.com/darthjee/navi)'s token-secured `/api/*` HTTP namespace.

Navi's `/api/*` namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`) allows external, programmatic control of an already-running Navi instance — pushing configuration in, starting a warming run, or stopping one — without hand-rolling requests and bearer-token handling yourself.

The `POST /api/config` payload can be built by hand, or loaded directly from the same YAML/JSON config files a self-hosted Navi engine reads (requires `navi-hey-client >= 0.1.1`):

```js
await client.configFromFiles(['./config/reports.yml']);
```

```sh
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config --file ./config/reports.yml
```

This guide is intended for developers and AI agents who want to control a running Navi instance from their own Node.js code, CI pipelines, or the command line.

---

## Table of Contents

- [Installation](./navi-client/installation.md) — installing `navi-hey-client` from npm.
- [Library Usage](./navi-client/library-usage.md) — using the `NaviClient` class in your own code.
- [CLI Usage](./navi-client/cli-usage.md) — using the `navi-client` command line tool.
- [Samples](./navi-client/samples.md) — end-to-end recipes for driving a running Navi instance.
- [Reference](./navi-client/reference.md) — the underlying `/api/*` HTTP namespace and error handling.
