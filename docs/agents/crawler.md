# Crawler Agent

## Why it exists

Today, `Source` and `StlModel` links are entered manually through the app. The
`crawler` specialist agent (`.claude/agents/crawler.md`) exists to eventually
maintain an STL-site crawler client — a Node.js program, scaffolded at
`crawler/`, that will visit STL sources and create the corresponding
`Source`/`StlModel` links in Majora automatically.

As of [issue #1148](issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md),
`crawler/` is a bare scaffold (`package.json`, `README.md`) with no crawling logic,
dependencies, or CI/docker-compose wiring — that comes in a follow-up
implementation issue owned by the `crawler` agent.

## Relationship to the miniatures API

Unlike the frontend, the crawler is a non-browser client, so it authenticates
against the Majora API using an API token (`Authorization: Token <key>`) rather
than a browser session cookie — a path `CookieTokenAuthentication`
(`backend/accounts/authentication.py`) already supports as the DRF-wide default.

The crawler's first consumer surface is the miniatures API (`Collection`,
`Source`, `StlModel`), documented for external/automated consumers at
[`docs/guides/majora/miniatures.md`](../guides/majora/miniatures.md) (hub:
[`docs/guides/majora.md`](../guides/majora.md)). Any future crawler
implementation work should start from that reference rather than reading the
backend views directly.
