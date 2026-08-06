# Installation

`navi-hey-client` is published on npm and works against any running Navi instance that has a `web.api.token` configured (see [Reference](./reference.md)).

```bash
npm install navi-hey-client
```

Installing it makes both the library (`NaviClient`) and the `navi-client` CLI command available — no separate install step is needed for the CLI.

To use only the CLI without adding the package as a project dependency, run it directly with `npx`:

```bash
npx navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
