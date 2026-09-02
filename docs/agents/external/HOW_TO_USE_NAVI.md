# How to Use Navi

[Navi](https://github.com/darthjee/navi) is a queue-based cache-warmer written in Node.js.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

This guide is intended for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects or CI/CD pipelines.
Four integration modes are covered:

- **Option A** — use the `darthjee/navi-hey` Docker image directly in a CI step.
- **Option B** — install the `navi-hey` npm package in a Node.js-capable CI image and run it from the command line.
- **Option C** — use `darthjee/navi-hey:latest` as the CircleCI executor image (simplest for CircleCI).
- **Option D** — host `darthjee/navi-hey` as a long-running server and drive it externally with `navi-hey-client`, without CI waiting for the warm-up run to finish.

---

## Table of Contents

- [Prerequisites](./navi/prerequisites.md) — YAML config file structure, top-level keys, and field reference table.
- [Option A — Docker image (`darthjee/navi-hey`)](./navi/option-a-docker-image.md) — Using the `darthjee/navi-hey` Docker image in a CI step.
- [Option B — Node.js image with `navi-hey` installed](./navi/option-b-nodejs-image.md) — Installing and running the `navi-hey` npm package in a Node.js CI image.
- [Option C — CircleCI executor image](./navi/option-c-circleci-executor.md) — Using `darthjee/navi-hey:latest` directly as the CircleCI executor image.
- [Option D — Hosted server + `navi-hey-client`](./navi/option-d-hosted-server.md) — Hosting `darthjee/navi-hey` as a long-running server and driving it via `navi-hey-client`, without CI blocking on the warm-up run.
- [Warming HTML pages and their assets](./navi/warming-html-assets.md) — Declaring an `assets` list so Navi also warms CSS/JS referenced by an HTML response.
- [Paginated Actions](./navi/paginated-actions.md) — Fanning out one request per page with `paginated_actions`.
- [Emit Configuration](./navi/emit-configuration.md) — Sending extracted items onward to an external endpoint with `emit`, including reshaping the body with `body_template`.
- [Splitting Configuration Across Files](./navi/splitting-configuration.md) — Using `include` and `namespace` to organize config across multiple files.
- [Samples](./navi/samples.md) — end-to-end, copy-paste recipes for cache warm-up and crawling.
- [Reference](./navi/reference.md) — CLI flags, environment variable substitution, and headless vs. web UI mode.
