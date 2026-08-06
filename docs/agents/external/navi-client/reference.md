# Reference

## The `/api/*` namespace

`navi-hey-client` is a thin wrapper — it performs no client-side config/resource logic of its own, it only forwards calls to a running Navi instance's token-secured `/api/*` HTTP namespace, attaching the `Authorization: Bearer <token>` header for you:

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/config` | Merges a payload namespace's `resources`/`clients` into the running instance. |
| `POST` | `/api/engine/start` | Starts a warming run, scoped per namespace via `targets`. |
| `POST` | `/api/engine/stop` | Stops the running engine (no body). |

For the full request/response shape of each route, see the [`/api` namespace documentation](https://github.com/darthjee/navi/blob/main/docs/agents/web-server.md#api-namespace) in Navi's own repository.

`web.api.token` — the bearer token every `/api/*` request must present — is a Navi-side config value on the target instance; see [How to Use Navi](../HOW_TO_USE_NAVI.md) for how to configure it.

## Error handling

Both the library and the CLI surface failures the same way: any request that fails outright, or that receives a response with status `>= 400`, rejects with an `ApiRequestFailed` error carrying:

| Field | Description |
|-------|-------------|
| `statusCode` | The HTTP status code returned, when a response was received. |
| `url` | The full URL that was requested. |
| `body` | The parsed response body, when available. |

In the CLI, this surfaces as the error message printed to stderr, with the process exiting with status `1`.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
