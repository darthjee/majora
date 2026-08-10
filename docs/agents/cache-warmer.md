# Cache Warmer

Majora uses [Navi](https://github.com/darthjee/navi) to warm the Tent proxy cache after each production release.
See [HOW_TO_USE_NAVI.md](external/HOW_TO_USE_NAVI.md) for the full Navi reference (a hub
linking to per-topic pages under `external/navi/`) — the config-format page
([external/navi/prerequisites.md](external/navi/prerequisites.md)), pagination page
([external/navi/paginated-actions.md](external/navi/paginated-actions.md)), and splitting page
([external/navi/splitting-configuration.md](external/navi/splitting-configuration.md)) are the
ones most relevant to maintaining `navi/navi_config.yaml`. CI now drives an already-deployed,
persistent Navi server via the `navi-hey-client` CLI instead of booting a fresh standalone
engine per build — see [external/navi-client/cli-usage.md](external/navi-client/cli-usage.md)
and [external/navi-client/installation.md](external/navi-client/installation.md#docker-image)
for that client's reference.

## Configuration

The Navi configuration entry file lives at
[`navi/navi_config.yaml`](../../navi/navi_config.yaml). It holds the `web`, `workers`, and
`failure` sections, and pulls in the `resources`/`clients` sections via a top-level `include:`
list from six files under [`navi/resources/`](../../navi/resources/):

- `treasures.yml` — top-level `/treasures.json` chain.
- `games.yml` — `/games.json` chain down through each game's detail, PCs, NPCs, treasures,
  items, photos, documents, and sessions listings (and their short-preview variants).
- `pcs.yml` — a PC's detail and its nested photos/treasures/items/documents.
- `npcs.yml` — an NPC's detail and its nested photos/treasures/items/documents.
- `permissions.yml` — the entity-agnostic `permissions_*` resources (see below).
- `clients.yml` — the `clients.default` block (base URL, timeout, headers) used to make every
  request in the other five files.

Every one of these six files declares a top-level `namespace: $NAVI_NAMEPACE` key, so every
resource/client they declare resolves into the `$NAVI_NAMEPACE` namespace instead of the
implicit `default` one. This is a literal, unresolved placeholder in the committed YAML —
it's resolved at read time by whoever loads the files (see "CI (CircleCI)" and "Local testing"
below for how each environment gives it a value). Cross-file `actions`/`paginated_actions`
references (e.g. a resource in `games.yml` pointing at `pc`/`npc` in `pcs.yml`/`npcs.yml`) need
no explicit `namespace` key of their own, since every file shares the same `$NAVI_NAMEPACE`
namespace and Navi merges same-namespace files together.

Within `games.yml`, the chain runs from `/games.json` down through each game's detail, PCs,
NPCs, treasures, items, photos, documents, and sessions, and from there (via
`pcs.yml`/`npcs.yml`) to
each character's/document's detail (and its nested photos/files/treasures/items) — the `slug`
extracted at the top of the chain is inherited by every resource below it, so it never needs
re-extracting. See the files under `navi/resources/` for the exact resource names and URL
patterns.

It also covers the entity-agnostic `permissions_*` resources (`permissions_game`,
`permissions_treasure`, `permissions_game_treasure`, `permissions_game_pc`,
`permissions_game_npc`), which warm `/permissions/<entity_type>.json` for each of the 5
canonical `?role=` combinations. These are
standalone, unparameterized top-level resources — unlike the chained resources above, they
don't need a `slug`/`id` from `parsedBody`/`parameters.*` since the response depends only on
entity type and the role query params, never on a specific entity instance.

## Maintaining this configuration

`navi/navi_config.yaml`, the files under `navi/resources/`, and this document are owned by
the [`cache`](../../.claude/agents/cache.md) agent. When a new API endpoint is added, it
should be added to the warm-up chain (in the domain file matching its entity) following these
rules:

- Include regular (unparameterized or already-reachable) endpoints, paginated resources
  (`paginated_actions`), nested resources reached via `actions`, and `short_*` resources that
  mirror shortlist requests made by the frontend (matching the real `MAX_PREVIEW_*` constant
  the frontend uses for `per_page`, not an arbitrary number).
- Never include mutation endpoints (anything other than `GET`).
- Never include restricted endpoints (cross-check `docs/agents/access-control/`) — except when
  the same URL serves both a regular and a restricted form (e.g. `/games.json`), in which case
  the regular form is included as usual. Note that `/games.json`'s per-domain form is itself
  cacheable — the proxy unconditionally partitions its cache into a `DomainHash`-named folder
  per domain (`proxy/extension/lib/cache/DomainHash.php`, wired into
  `proxy/prod_configuration/rules/games.php`) rather than relying on blanket `X-Skip-Cache:
  true` — it's still excluded from Navi's warm-up chain, but only because Navi has no
  multi-domain `clients:`/resource config to warm it yet, not because the response can't be
  cached.
- When an intermediate resource's response body doesn't carry a parameter needed further down
  the chain (e.g. a detail serializer that omits `game_slug`), carry it forward via Navi's
  inherited `parameters.*` namespace instead of `parsedBody.*`.

## CI (CircleCI)

CI no longer boots a fresh standalone Navi engine per build. Instead it drives an
already-deployed, persistent Navi server (`$NAVI_URL`) via the `navi-hey-client` CLI
(`darthjee/navi-hey-client:latest` image), which pushes Majora's resource/client config to
that server and then triggers a warm-up run for the build's own namespace slice. The
`include:`/standalone-engine mechanics described above still apply — they're just now driven
by `infra`'s CI scripts instead of a `navi-hey --config ...` invocation. Owning the CI job
definitions, scripts, and env-var wiring themselves is `infra`'s
(`../../.claude/agents/infra.md`) responsibility, not this agent's — this section only
documents the flow as it affects the files this agent owns.

- **`warm-up-cache`** — still runs automatically after `release`, gated to version tags
  (`\d+\.\d+\.\d+`). It uses `darthjee/navi-hey-client:latest` directly as the executor and
  runs `infra`'s `scripts/warm_navi_cache.sh` in two steps: `config` (pushes every file under
  `navi/resources/`, including `clients.yml`, via one `navi-client -a config --file ...` call
  per file) and `engine-start` (triggers the warm-up for the build's namespace).
- **`wake-navi`** — a new, non-blocking job that runs `infra`'s `scripts/wake_navi.sh` early in
  the workflow (no `requires:`, so it doesn't gate or get gated by anything) to ping `$NAVI_URL`
  awake before `warm-up-cache` needs it, retrying while the server responds `502`.
- **Namespace resolution** — every file under `navi/resources/` declares
  `namespace: $NAVI_NAMEPACE` (see "Configuration" above). In CI, `infra`'s `warm-up-cache` job
  computes `NAVI_NAMEPACE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"` before invoking
  `navi-client`, so each build gets its own namespace slice on a Navi server that may be shared
  across multiple builds/apps. `$MAJORA_NAMESPACE`, `$NAVI_URL`, and `$NAVI_API_TOKEN` must be
  set in the CircleCI project settings (Project Settings → Environment Variables), the same
  convention already used for `MAJORA_PRODUCTION_URL` below.
- The `MAJORA_PRODUCTION_URL` and `STATISTICS_SKIP_SECRET` environment variables must still be
  set in the CircleCI project settings — they're read into `navi/resources/clients.yml`'s
  `clients.default` block the same way as before, just via a different file.

## Local testing (Docker Compose)

Local dev is unaffected by the CI change above: `docker-compose up majora_navi` still runs the
standalone `darthjee/navi-hey` server against `navi/navi_config.yaml`, which now also pulls in
`resources/clients.yml` through the same `include:` chain as the other five resource files.

To test the cache warmer locally, set `MAJORA_PRODUCTION_URL` in your `.env` file (defaults to
`http://localhost:3000` in `.env.dev.sample`) and run:

```bash
docker-compose up majora_navi
```

The Navi web UI will be available at <http://localhost:3100> while the container is running.
To point it at production instead of localhost, override the variable:

```bash
MAJORA_PRODUCTION_URL=https://your-production-domain.com docker-compose up majora_navi
```

`NAVI_NAMEPACE` doesn't need to be set manually for local dev — it defaults to `default` in
`.env.dev.sample`, matching Navi's own "absent `namespace:` falls back to `default`"
convention.
