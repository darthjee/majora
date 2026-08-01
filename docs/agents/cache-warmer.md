# Cache Warmer

Majora uses [Navi](https://github.com/darthjee/navi) to warm the Tent proxy cache after each production release.
See [HOW_TO_USE_NAVI.md](external/HOW_TO_USE_NAVI.md) for the full Navi reference (a hub
linking to per-topic pages under `external/navi/`) — the config-format page
([external/navi/prerequisites.md](external/navi/prerequisites.md)), pagination page
([external/navi/paginated-actions.md](external/navi/paginated-actions.md)), and splitting page
([external/navi/splitting-config.md](external/navi/splitting-config.md)) are the ones most
relevant to maintaining `navi/navi_config.yaml`.

## Configuration

The Navi configuration entry file lives at
[`navi/navi_config.yaml`](../../navi/navi_config.yaml). It holds the `web`, `workers`,
`failure`, and `clients` sections, and pulls in the `resources` sections via a top-level
`include:` list from five domain files under
[`navi/resources/`](../../navi/resources/):

- `treasures.yml` — top-level `/treasures.json` chain.
- `games.yml` — `/games.json` chain down through each game's detail, PCs, NPCs, treasures,
  items, documents, and sessions listings (and their short-preview variants).
- `pcs.yml` — a PC's detail and its nested photos/treasures/items/documents.
- `npcs.yml` — an NPC's detail and its nested photos/treasures/items/documents.
- `permissions.yml` — the entity-agnostic `permissions_*` resources (see below).

None of these files declare a `namespace:` key, so every resource still resolves in the
default namespace and cross-file `actions`/`paginated_actions` references (e.g. a resource in
`games.yml` pointing at `pc`/`npc` in `pcs.yml`/`npcs.yml`) need no `namespace` key.

Within `games.yml`, the chain runs from `/games.json` down through each game's detail, PCs,
NPCs, treasures, items, documents, and sessions, and from there (via `pcs.yml`/`npcs.yml`) to
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
  the regular form is included as usual.
- When an intermediate resource's response body doesn't carry a parameter needed further down
  the chain (e.g. a detail serializer that omits `game_slug`), carry it forward via Navi's
  inherited `parameters.*` namespace instead of `parsedBody.*`.

## CI (CircleCI)

The `warm-up-cache` job runs automatically after `release` on version tags (`\d+\.\d+\.\d+`).
It uses the `darthjee/navi-hey:latest` image directly as the executor and reads
`navi/navi_config.yaml` (which in turn includes the files under `navi/resources/`) from the
checked-out repository.

```yaml
warm-up-cache:
  docker:
    - image: darthjee/navi-hey:latest
  steps:
    - checkout
    - run:
        name: Warm up proxy cache
        command: navi-hey --config navi/navi_config.yaml
```

The `MAJORA_PRODUCTION_URL` environment variable must be set in the CircleCI project settings
(Project Settings → Environment Variables).

## Local testing (Docker Compose)

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
