# How to Use Navi

[Navi](https://github.com/darthjee/navi) is a queue-based cache-warmer written in Node.js.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

This guide is intended for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects or CI/CD pipelines.
Three integration modes are covered:

- **Option A** — use the `darthjee/navi-hey` Docker image directly in a CI step.
- **Option B** — install the `navi-hey` npm package in a Node.js-capable CI image and run it from the command line.
- **Option C** — use `darthjee/navi-hey:latest` as the CircleCI executor image (simplest for CircleCI).

The full guide is split into focused pages under [`navi/`](navi/). Read only the page(s) relevant to your task to save tokens.

---

## Table of Contents

| Page | Covers |
|------|--------|
| [Prerequisites](navi/prerequisites.md) | The Navi YAML config format: `workers`, `log`, `failure`, `clients`, `resources`, `actions`, `paginated_actions`, `assets`, and the `parsedBody` path-expression gotcha. |
| [Option A — Docker image](navi/option-a-docker.md) | Running `darthjee/navi-hey` via `docker run` in GitHub Actions / CircleCI. |
| [Option B — Node.js image](navi/option-b-nodejs.md) | Installing/running the `navi-hey` npm package via `npx` or a global install. |
| [Option C — CircleCI executor image](navi/option-c-circleci.md) | Using `darthjee/navi-hey:latest` directly as the CircleCI job image (recommended for CircleCI). |
| [Warming HTML pages and their assets](navi/html-assets.md) | The `assets` list: extracting and warming `<link>`/`<script>` URLs from HTML responses. |
| [Paginated Actions](navi/paginated-actions.md) | Using `paginated_actions` to fan out one request per page. |
| [Splitting Configuration Across Files](navi/splitting-config.md) | `include` and `namespace` for multi-file configs. |
| [Reference](navi/reference.md) | CLI flags, environment variable substitution, headless vs. web UI mode. |

---

## Quick start

1. Write a `navi_config.yml` — see [Prerequisites](navi/prerequisites.md) for the format.
2. Pick an integration mode: [Option A (Docker)](navi/option-a-docker.md), [Option B (npm/npx)](navi/option-b-nodejs.md), or [Option C (CircleCI executor image)](navi/option-c-circleci.md).
3. Need HTML asset warming, pagination, or a multi-file config? See the relevant page above.
4. For CLI flags and env var handling, see [Reference](navi/reference.md).
