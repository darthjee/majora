# Cache Warmer

Majora uses [Navi](https://github.com/darthjee/navi) to warm the Tent proxy cache after each production release.
See [HOW_TO_USE_NAVI.md](external/HOW_TO_USE_NAVI.md) for the full Navi reference.

## Configuration

The Navi configuration lives in [`.circleci/navi_config.yaml`](../../.circleci/navi_config.yaml).

It covers all `.json` API endpoints, chaining from `/games.json` down through each game's
detail, PCs, NPCs, treasures, items, documents, and sessions, and from there to each
character's/document's detail (and its nested photos/files/treasures/items) — the `slug`
extracted at the top of the chain is inherited by every resource below it, so it never needs
re-extracting. See `.circleci/navi_config.yaml` for the exact resource names and URL
patterns.

## Maintaining this configuration

`.circleci/navi_config.yaml` (and this document) is owned by the
[`cache`](../../.claude/agents/cache.md) agent. When a new API endpoint is added, it should be
added to the warm-up chain following these rules:

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
`.circleci/navi_config.yaml` from the checked-out repository.

```yaml
warm-up-cache:
  docker:
    - image: darthjee/navi-hey:latest
  steps:
    - checkout
    - run:
        name: Warm up proxy cache
        command: navi-hey --config .circleci/navi_config.yaml
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
