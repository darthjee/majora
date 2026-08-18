# Majora Crawler

Scaffold only — no crawling logic yet. This will become an STL-site crawler: a
Node.js client that visits STL sources (e.g. Thingiverse, MyMiniFactory, Patreon
pages) and creates the corresponding `Source`/`StlModel` links in Majora
automatically, instead of them being entered manually through the app.

## Planned shape

- Node.js project, managed with Yarn (matching `frontend/`'s package manager
  convention).
- Authenticates against the Majora API via an `Authorization: Token <key>` header
  (not a browser session cookie) — see
  [`docs/guides/majora/miniatures.md`](../docs/guides/majora/miniatures.md) for the
  full API contract it will consume, and
  [`docs/guides/majora.md`](../docs/guides/majora.md#authentication) for how to
  obtain a token today (Django admin).

## Explicitly out of scope for now

- Actual crawling implementation (visiting STL sites, parsing pages, creating
  `Source`/`StlModel` links via the API) — a follow-up issue, owned by the
  `crawler` specialist agent once real code exists here.
- Dependencies — none are declared yet.
- CI/dev tooling wiring (docker-compose service, CircleCI job) — added alongside
  the actual crawler code in that follow-up issue.

See [issue #1148](../docs/agents/issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md)
for the background on why this scaffold exists now.
