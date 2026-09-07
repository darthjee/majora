# Majora Crawler

Scaffold today — no crawling logic lives directly in this package yet. This is
becoming an STL-site crawler built on top of [Navi](../docs/agents/external/HOW_TO_USE_NAVI.md)
(used as the crawling engine, not a bespoke Node.js client): it visits STL
sources (starting with Lootstudios — see
[`docs/agents/specs/loot-crawling.md`](../docs/agents/specs/loot-crawling.md))
and creates the corresponding `Source`/`StlModel` links in Majora
automatically, instead of them being entered manually through the app.

The first concrete instance of this — the Lootstudios crawler — is tracked
end-to-end by parent issue [#1260](https://github.com/darthjee/majora/issues/1260)
and its sub-issues (backend import endpoint #1262, Navi config #1263). Once
those land, see [`RUNNING.md`](RUNNING.md) for how to actually operate it.

## Planned shape

- Node.js project, managed with Yarn (matching `frontend/`'s package manager
  convention).
- Authenticates against the Majora API via an `Authorization: Token <key>` header
  (not a browser session cookie) — see
  [`docs/guides/majora/miniatures.md`](../docs/guides/majora/miniatures.md) for the
  full API contract it will consume, and
  [`docs/guides/majora.md`](../docs/guides/majora.md#authentication) for how to
  obtain a token today (Django admin).

## Running the crawler

Once #1262 (backend import endpoint) and #1263 (Navi config) land, see
[`RUNNING.md`](RUNNING.md) for the full runbook: prerequisites, obtaining a
Lootstudios session credential, the actual invocation, and how to verify a
run worked. `RUNNING.md` is a permanent operational doc (unlike the specs
under `docs/agents/specs/`, it isn't removed once the feature ships) —
maintainers running the crawler going forward should start there, not here.

## Explicitly out of scope for now

- Actual crawling implementation (visiting STL sites, parsing pages, creating
  `Source`/`StlModel` links via the API) — tracked by #1262 (backend import
  endpoint) and #1263 (Navi config), both still open as of this writing.
- Dependencies — none are declared yet; #1263 is scoped to a Navi config plus
  whatever running Navi itself requires (no new Node.js dependencies/CLI
  wrapper).
- CI/dev tooling wiring (docker-compose service, CircleCI job) — explicitly
  out of scope for the Lootstudios crawler entirely: it's a maintainer-run,
  local-only tool (Lootstudios' catalog endpoint is gated behind a personal
  logged-in session, not a service credential), not something CI runs.

See [issue #1148](../docs/agents/issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md)
for the background on why this scaffold exists now, and
[#1260](https://github.com/darthjee/majora/issues/1260) for the Lootstudios
crawler effort tracking issue.
