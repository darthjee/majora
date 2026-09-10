# Option E — Development image (`navi:dev`)

> `navi:dev` is Navi's own local development image, built from `dockerfiles/dev_navi_hey/Dockerfile` via `make build-dev`. Unlike the production `darthjee/navi-hey` image, it bundles **no application code** — the Dockerfile only installs dependencies. Running it always requires a local checkout of this repo: `docker-compose.yml`'s `base` service mounts `./source`, `./worker`, and `./docker_volumes/config` into it at runtime.

Use this option when you want to try Navi out or develop against it locally, without going through a production build. It is not one of the CI/production integration modes (Options A–D) covered in [How to Use Navi](../how_to_use_navi.md) — it's a local trial/dev path.

### Standalone run

First-time setup, once:

```bash
make setup
```

This copies `docker_volumes/config/navi_config.yml.sample` to `docker_volumes/config/navi_config.yml` (if it doesn't already exist), builds the `base_build` image, and runs `yarn install` so `docker_volumes/node_modules` is populated.

Then build and run the dev image directly:

```bash
make build-dev

docker run --rm -p 3000:3000 \
  -v $(pwd)/source:/home/node/app \
  -v $(pwd)/worker:/home/node/worker \
  -v $(pwd)/docker_volumes/config:/home/node/app/config \
  -v $(pwd)/docker_volumes/node_modules:/home/node/app/node_modules \
  navi:dev \
  node bin/navi.js -c config/navi_config.yml
```

This mirrors the `base`/`navi_app` service shape in `docker-compose.yml` — same image, same mounts, same `3000:3000` port mapping — just run standalone instead of through Compose. It exposes the same web UI / API routes as production Option A; see [Reference](./reference.md).

### `navi_extensions_app`

`docker-compose.yml` also defines `navi_extensions_app`, which runs this same `navi:dev` image with `NAVI_EXTENSIONS_ENABLED=true` on port `3040`, layering the `examples/navi-orders-extension` example on top of it. It requires building that example first:

```bash
cd examples/navi-orders-extension && npm ci && npm run build
```

(this mirrors the setup done by the `smoke-extensions` Makefile target). Once built, bring the service up:

```bash
docker compose up navi_extensions_app
```

For the extensions-authoring workflow itself — enabling extensions, folder layout, backend routes, frontend pages, menu entries — see [Extending Navi with Your Own Routes and Pages](./extending-navi.md).

### `navi_app` / `make dev` (not a way to run Navi)

The same `navi:dev` image also backs the unrelated `navi_app` Compose service, used via `make dev` to open an interactive shell (`yarn test`, `yarn lint`, and so on) — it runs `tail -f /dev/null` and never serves HTTP. See the root [`README.md`](../../../README.md#development)'s Development section for that workflow.

### Ports/routes

| Path | Port | Serves |
|------|------|--------|
| Standalone `docker run` | `3000` (container `3000`) | Web UI / API, same routes as production Option A — see [Reference](./reference.md) |
| `navi_extensions_app` | `3040` (host) → `3000` (container) | Same routes, plus the mounted `examples/navi-orders-extension` extension |
| `navi_app` / `make dev` | none (no `command` server) | Interactive shell only, no HTTP |

### Not to be confused with `dev/`

This guide is about running Navi's own `navi:dev` image. The separate `dev/` folder (`navi_dev_app`, `navi_dev_frontend`, `navi_proxy`, `navi_web_proxy`) is a sample target backend plus Tent reverse proxies used to exercise Navi's cache-warming behavior against a controlled dataset — it is not what this guide covers. See `docs/agents/dev-app.md` and `docs/agents/dev-proxy.md` for that.

[← Back to How to Use Navi](../how_to_use_navi.md)
