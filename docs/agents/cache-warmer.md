# Cache Warmer

Majora uses [Navi](https://github.com/darthjee/navi) to warm the Tent proxy cache after each production release.
See [HOW_TO_USE_NAVI.md](HOW_TO_USE_NAVI.md) for the full Navi reference.

## Configuration

The Navi configuration lives in [`.circleci/navi_config.yaml`](../../.circleci/navi_config.yaml).

It covers all `.json` API endpoints, starting from `/games.json` and chaining through the full
resource tree:

| Resource | URL | Notes |
|----------|-----|-------|
| `games` | `/games.json` | Entry point — chains to `game_detail`, `game_pcs`, `game_npcs` per game |
| `game_detail` | `/games/{:slug}.json` | Game detail including links |
| `game_pcs` | `/games/{:slug}/pcs.json` | Player characters — chains to `character` per PC |
| `game_npcs` | `/games/{:slug}/npcs.json` | Non-player characters — chains to `character` per NPC |
| `character` | `/games/{:slug}/characters/{:id}.json` | Character detail including photos |

The `slug` parameter extracted from `/games.json` (`parsedBody.game_slug`) is inherited by chained
resources, so `game_pcs` and `game_npcs` can pass it down to `character` without re-extracting it.

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
