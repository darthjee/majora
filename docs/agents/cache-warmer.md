# Cache Warmer

Majora uses [Navi](https://github.com/darthjee/navi) to warm the Tent proxy cache after each production release.
See [HOW_TO_USE_NAVI.md](HOW_TO_USE_NAVI.md) for the full Navi reference.

## Configuration

The Navi configuration lives in [`.circleci/navi_config.yaml`](../../.circleci/navi_config.yaml).

It covers all `.json` API endpoints, chaining from `/games.json` down through each game's
detail, PCs, and NPCs, and from there to each character's detail — the `slug` extracted at
the top of the chain is inherited by every resource below it, so it never needs
re-extracting. See `.circleci/navi_config.yaml` for the exact resource names and URL
patterns.

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
