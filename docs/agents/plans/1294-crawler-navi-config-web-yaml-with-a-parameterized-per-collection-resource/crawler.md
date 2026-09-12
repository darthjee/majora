# Crawler Plan: Crawler: navi_config.web.yaml with a parameterized per-collection resource

Main plan: [plan.md](plan.md)

## Overview

Create `crawler/navi_config.web.yaml`, a new Navi entry file that `include`s
the existing headless `crawler/navi_config.yaml` unchanged and adds the
`web:`/`workers:` sections a web-enabled boot needs. Per
`docs/agents/external/navi/splitting-configuration.md`, Navi reads
`web:`/`workers:`/`log:`/`failure:` **only from the entry file** — an
included file only ever contributes `resources`/`clients` — so this can't be
added to `navi_config.yaml` itself without also enabling the web UI for the
headless run, which must stay byte-identical.

## Context

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler"). Building on #1292's now-landed spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`), this
file is purely static wiring: it does **not** declare any per-collection
resource. #1295's extension backend handler builds and pushes that resource
entirely at runtime via `POST /api/config`, into a fresh
`enqueue_<slug>_<uuid>` namespace per Enqueue click. For that pushed
resource's bare `client: lootstudios` / `emit.client: majora_api`
references to resolve (Navi's cross-namespace fallback-to-`default` rule),
`navi_config.web.yaml` and its included clients must live in the implicit
`default` namespace — i.e. this file must **not** declare a top-level
`namespace:` key. This is the one hard constraint the whole feature depends
on; get it wrong and every future Enqueue silently fails to resolve its
clients.

## Implementation Steps

### Step 1 — Create `crawler/navi_config.web.yaml`

Add the new entry file, e.g.:

```yaml
# Web-enabled Navi entry config for the Lootstudios crawler's interactive
# per-collection Enqueue UI (issue #1291). Includes the existing headless
# config unchanged and adds only the web/worker wiring needed to boot with
# a paused engine and a monitoring UI/API. Declares NO top-level
# `namespace:` key — this file (and the clients it includes) must stay in
# the implicit `default` namespace so every per-enqueue namespace #1295
# pushes at runtime can reference `client: lootstudios` /
# `emit.client: majora_api` by bare name and have them resolve via Navi's
# cross-namespace fallback-to-default rule. See
# docs/agents/specs/loot-crawling/interactive-collection-enqueue.md.

include:
  - navi_config.yaml

workers:
  quantity: 4
  retry_cooldown: 2000
  sleep: 500
  max-retries: 3

web:
  port: 3000
  autostart: false
  api:
    token: $NAVI_API_TOKEN
```

Notes on each key, referencing the landed spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`,
"Engine lifecycle & config" and "Concurrency" sections) and
`docs/agents/external/navi/configuration-schema.md`:

- `include: [navi_config.yaml]` — relative to this file's own directory
  (`crawler/`), pulls in the `lootstudios`/`majora_api` clients and the
  `loot_catalog` resource unchanged.
- No `namespace:` key at the top level — see "Context" above. Do not add
  one even implicitly by copying a pattern from
  `docs/agents/external/navi/splitting-configuration.md`'s examples, which
  do declare `namespace:` on their included files (a different scenario
  from this one).
- `workers.quantity: 4` — must be at least `2` per the spec so concurrent
  Enqueues aren't serialized; `4` gives comfortable headroom for a
  local, single-maintainer tool without over-provisioning. Mirror
  `retry_cooldown`/`sleep`/`max-retries` from `navi_config.yaml`'s existing
  `workers:` block unchanged (`2000`/`500`/`3`) since `include` doesn't
  carry this section over.
- `web.port: 3000` — matches Navi's own schema example. #1298's
  docker-compose service maps a host port onto this container-internal
  port; it is not this issue's concern.
- `web.autostart: false` — boot with the engine `stopped`; the first
  Enqueue's `POST /api/engine/start` call starts it (same call handles
  every Enqueue after that too, per the spec).
- `web.api.token: $NAVI_API_TOKEN` — the exact env var name the spec pins
  in its "Engine lifecycle & config" section. #1295's handler and #1298's
  compose wiring both read/supply this same variable.
- `log:`/`failure:` — deliberately **not** declared; Navi's built-in
  defaults (`log.size: 100`, no `failure.threshold`) apply, matching
  `navi_config.yaml`'s own (implicit) behavior today. There is no
  non-default value to mirror.
- `extraction.size`/`emit.size` — left at the `100`-entry default; add only
  later if the stock dashboards prove too small for this file's traffic.

### Step 2 — Verify the wiring

Manual verification (no automated test harness covers Navi config files in
this repo; see "CI Checks" below):

1. `git diff crawler/navi_config.yaml` — must be empty. The new file only
   `include`s it; nothing about it changes.
2. `npx navi-hey --config crawler/navi_config.yaml` (the existing headless
   invocation, env vars per `crawler/RUNNING.md`) — still exits cleanly,
   proving the include didn't disturb the original config.
3. `NAVI_API_TOKEN=<token> npx navi-hey --config crawler/navi_config.web.yaml`
   — boots with the engine paused; the stock monitoring UI/API is reachable
   on `http://localhost:3000` and `GET /stats.json` (or equivalent) reports
   the engine `stopped`.
4. Namespace-resolution check (the hard constraint from "Context" above):
   with the web instance from step 3 running, manually `POST /api/config`
   (bearer = `$NAVI_API_TOKEN`) a small resource under a fresh namespace
   whose `client`/`emit.client` are bare `lootstudios`/`majora_api`
   references and that declares no `namespace:` key of its own — e.g. via
   `navi-client`'s CLI
   (`docs/agents/external/HOW_TO_USE_NAVI-CLIENT.md`,
   `docs/agents/external/navi-client/cli-usage.md`) or a one-off `curl`.
   Confirm the push succeeds (no "client not found" config error) — this is
   the concrete proof that omitting `namespace:` here actually gives
   runtime-pushed resources default-namespace fallback, not just a
   plausible reading of the spec.

## Files to Change

- `crawler/navi_config.web.yaml` (new) — the entry file from Step 1.
- `crawler/navi_config.yaml` — read-only reference; touch nothing in it
  (verified via `git diff` in Step 2).

## Notes

- No CI job runs the Lootstudios crawler config at all — per
  `crawler/RUNNING.md`, it's "a maintainer-run, on-demand tool, not
  something CI runs" (its `GetMyLootsCache` calls depend on a personal,
  logged-in Lootstudios session). `## CI Checks` is intentionally omitted
  from this plan.
- `#1295` (extension backend route) and `#1298` (derived image +
  docker-compose service) both build directly on this file; get the
  no-`namespace:` constraint and the `NAVI_API_TOKEN` env var name right
  since both are load-bearing contracts, not internal details.
- Verifying Step 2 requires a local `navi-hey` (via `npx` or a global
  install, see `crawler/RUNNING.md` prerequisites) and a real
  `NAVI_API_TOKEN` value — there is no automated spec/test suite for Navi
  YAML config files in this repo, so this verification is manual.
