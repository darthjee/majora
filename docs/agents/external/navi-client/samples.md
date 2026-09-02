# navi-hey-client Samples

Recipes for driving an already-running Navi instance from Node code or a CI shell
through its token-secured `/api/*` wrapper. Each recipe is self-contained — it
embeds the full script or command it illustrates and traces what the client does
with concrete values. They complement the per-topic reference pages in
[How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md); each recipe's *Notes*
section links to the matching guide for the full field reference.

- [Push a config and start a scoped run](samples/push-config-and-start.md) — library: hand-built `config()` payload, then `engineStart()` scoped via `targets`.
- [Load config from the same files the engine reads](samples/config-from-files.md) — library: `configFromFiles()` over the engine's own YAML/JSON, one call per namespace, local `$VAR` resolution.
- [Kick off a run from a CI step (CLI)](samples/cli-ci-warmup.md) — CLI: `--action engine-start` in a GitHub Actions / CircleCI step, using the Docker image.
- [Handle a failed API call](samples/error-handling.md) — catching `ApiRequestFailed` (`statusCode` / `url` / `body`) in the library and CLI.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
