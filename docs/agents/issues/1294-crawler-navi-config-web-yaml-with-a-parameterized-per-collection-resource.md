# Issue: Crawler: navi_config.web.yaml with a parameterized per-collection resource

## Description

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler"). The Lootstudios crawler is a Navi config
(`crawler/navi_config.yaml`) run headless via `npx navi-hey` that imports the
whole `GetMyLootsCache` catalog into Majora via
`POST /miniatures/collections/import.json` (#1281) and
`POST /miniatures/stl_models/import.json` (#1262). #1291 adds an interactive
alternative: a Navi extension page with a collection-URL input + "Enqueue"
button that fires a real Navi queue job to crawl one collection. The headless
whole-catalog run stays byte-identical and primary; the new mode is additive
and local-maintainer-run.

Navi reads `web:`/`workers:`/`log:`/`failure:` **only from the config entry
file** — an `include`d file only ever contributes `resources`/`clients`
(`docs/agents/external/navi/splitting-configuration.md`). So the web wiring
goes into a new entry file, `crawler/navi_config.web.yaml`, that `include`s
the existing headless config unchanged.

Building on #1292's now-landed spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`), this
issue's scope is narrower than the original draft: the per-collection
resource is **not** declared anywhere in this file. #1295's extension
backend handler builds and pushes it entirely at runtime via
`POST /api/config` (spec, "Per-collection resource shape"). This issue is
purely the static entry-file wiring #1295 and #1298 build on top of.

## Expected Behavior

- `npx navi-hey --config crawler/navi_config.web.yaml` boots with the engine
  paused (`autostart: false`) and the stock Jobs/Logs screens reachable on
  port `3000`.
- `git diff crawler/navi_config.yaml` is empty.
- A headless dry-run of the old config
  (`npx navi-hey --config crawler/navi_config.yaml`) still succeeds
  unchanged.
- A resource manually `POST /api/config`-ed under a fresh namespace, with
  bare `client: lootstudios` / `emit.client: majora_api` references and no
  `namespace:` key of its own, resolves those clients successfully —
  confirming the "no top-level `namespace:` key" requirement actually holds
  in practice, not just on paper.

## Solution

Create `crawler/navi_config.web.yaml`:

- **`include: [navi_config.yaml]`** — pulls in the existing
  `lootstudios`/`majora_api` clients and the `loot_catalog` resource
  unchanged.
- **No top-level `namespace:` key.** This file (and therefore its included
  clients) must stay in the implicit `default` namespace — the spec pins
  this so that every per-enqueue namespace #1295 pushes at runtime
  (`enqueue_<slug>_<uuid>`) can reference `client: lootstudios` /
  `emit.client: majora_api` by bare name and have them resolve via Navi's
  cross-namespace fallback-to-`default` rule
  (`docs/agents/external/navi/splitting-configuration.md`, "Cross-namespace
  references"), without re-supplying `base_url`/headers on every push.
- **`web:`** — `port: 3000` (matches Navi's own schema example; #1298 owns
  the docker-compose host-side port mapping on top of this internal port),
  `api.token: $NAVI_API_TOKEN` (env var name fixed by the spec's "Engine
  lifecycle & config" section), `autostart: false` (boot with the engine
  paused until the first Enqueue).
- **Its own `workers:`.** Included files don't contribute this section, so
  it must be redeclared here rather than inherited. `quantity: 4` (per the
  spec's "Concurrency" section: must be at least `2` so concurrent Enqueues
  aren't serialized; `4` is sufficient headroom for a handful of concurrent
  local Enqueue clicks, not a high-throughput service). Mirror
  `retry_cooldown`/`sleep`/`max-retries` from `navi_config.yaml`
  (`2000`/`500`/`3`).
- **`log:`/`failure:`** — left undeclared (defaults apply), same as
  `navi_config.yaml` today; there is no non-default value to mirror.
- **`extraction.size`/`emit.size`** — optional; add only if the stock
  dashboards need a bigger ring buffer than the `100`-entry default for
  this file's own traffic.
- **No per-collection resource template.** Per #1292's now-landed spec
  (`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`,
  "Per-collection resource shape"), that resource is built and pushed
  entirely at runtime by #1295's extension backend handler via
  `POST /api/config` — it does not live in this file, superseding the
  original draft's "single-collection resource template" scope item.
- **`crawler/navi_config.yaml` stays byte-identical** — `git diff` on it
  must be empty. This is one of the "Expected Behavior" criteria above.

Touches only `crawler/navi_config.web.yaml` (new); `crawler/navi_config.yaml`
is a read-only reference.

Owner: **crawler**. Depends on: #1292 (spec — landed). Blocks: #1295
(backend route), #1298 (infra derived image + compose service).
