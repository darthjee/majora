# How to Use Navi

[Navi](https://github.com/darthjee/navi) is a queue-based cache-warmer written in Node.js.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

This guide is intended for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects or CI/CD pipelines.
Navi can also be used to **crawl** — extract structured items from each response and emit them onward to another endpoint. Any extraction or emission requires the resource-request entry to declare a `parser:` block; without one, nothing is extracted and an `emit:` block does nothing. See [Extraction Configuration](./navi/extraction-configuration.md).

Four integration modes are covered:

- **Option A** — use the `darthjee/navi-hey` Docker image directly in a CI step.
- **Option B** — install the `navi-hey` npm package in a Node.js-capable CI image and run it from the command line.
- **Option C** — use `darthjee/navi-hey:latest` as the CircleCI executor image (simplest for CircleCI).
- **Option D** — host `darthjee/navi-hey` as a long-running server and drive it externally with `navi-hey-client`, without CI waiting for the warm-up run to finish.

To try Navi locally without any of the above — no production build, no CI — see Option E — Development image.

---

## Table of Contents

- [Prerequisites](./navi/prerequisites.md) — YAML config file structure, top-level keys, and field reference table.
- [Configuration Schema](./navi/configuration-schema.md) — full YAML field-by-field reference for every config key.
- [Option A — Docker image (`darthjee/navi-hey`)](./navi/option-a-docker-image.md) — Using the `darthjee/navi-hey` Docker image in a CI step.
- [Option B — Node.js image with `navi-hey` installed](./navi/option-b-nodejs-image.md) — Installing and running the `navi-hey` npm package in a Node.js CI image.
- [Option C — CircleCI executor image](./navi/option-c-circleci-executor.md) — Using `darthjee/navi-hey:latest` directly as the CircleCI executor image.
- [Option D — Hosted server + `navi-hey-client`](./navi/option-d-hosted-server.md) — Hosting `darthjee/navi-hey` as a long-running server and driving it via `navi-hey-client`, without CI blocking on the warm-up run.
- [Option E — Development image](./navi/option-e-development-image.md) — Running Navi's own `navi:dev` image locally to try it out or develop against it, without a production build.
- [Warming HTML pages and their assets](./navi/warming-html-assets.md) — Declaring an `assets` list so Navi also warms CSS/JS referenced by an HTML response.
- [Paginated Actions](./navi/paginated-actions.md) — Fanning out one request per page with `paginated_actions`.
- [Extraction Configuration](./navi/extraction-configuration.md) — Extracting structured items from a response with a required `parser:` block (`regex` / `json_path` / `css`), consumed by `emit`.
- [Emit Configuration](./navi/emit-configuration.md) — Sending extracted items onward to an external endpoint with `emit`, including reshaping the body with `body_template`.
- [Splitting Configuration Across Files](./navi/splitting-configuration.md) — Using `include` and `namespace` to organize config across multiple files.
- [Extending Navi with Your Own Routes and Pages](./navi/extending-navi.md) — Adding custom backend routes and frontend pages to the stock image via a mounted, opt-in extensions volume.
- [Configuring the internal navigation menu](./navi/configuring-the-menu.md) — Adding, hiding, reordering, and relabelling entries in the internal menu via config/menu.yml.
- [Samples](./navi/samples.md) — end-to-end, copy-paste recipes for cache warm-up and crawling.
- [Reference](./navi/reference.md) — CLI flags, environment variable substitution, and headless vs. web UI mode.
