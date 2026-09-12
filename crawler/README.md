# Majora Crawler

This is an STL-site crawler built on top of [Navi](../docs/agents/external/HOW_TO_USE_NAVI.md)
(used as the crawling engine, not a bespoke Node.js client): it visits STL
sources (starting with Lootstudios — see
[`docs/agents/specs/loot-crawling.md`](../docs/agents/specs/loot-crawling.md))
and creates the corresponding `Source`/`StlModel` links in Majora
automatically, instead of them being entered manually through the app.

The first concrete instance of this — the Lootstudios crawler — is tracked
end-to-end by parent issue [#1260](https://github.com/darthjee/majora/issues/1260)
and its sub-issues (backend import endpoint #1262, Navi config #1263, both
landed). See [`RUNNING.md`](RUNNING.md) for how to actually operate it.

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

`RUNNING.md` documents both ways to run the Lootstudios crawler: the
headless, whole-catalog run (`npx navi-hey --config crawler/navi_config.yaml`)
and the interactive per-collection Enqueue mode (#1291) — a Navi extension
page for crawling one Lootstudios collection on demand. See
[`RUNNING.md`](RUNNING.md) for the full runbook: prerequisites, obtaining a
Lootstudios session credential, the actual invocation of each mode, and how
to verify a run worked. `RUNNING.md` is a permanent operational doc (unlike
the specs under `docs/agents/specs/`, it isn't removed once the feature
ships) — maintainers running the crawler going forward should start there,
not here.

## Explicitly out of scope for now

- A generic, multi-site crawler — only Lootstudios is supported today, via
  Navi (backend import endpoint #1262, Navi config #1263, both landed).

See [issue #1148](../docs/agents/issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md)
for the background on why this scaffold exists now, and
[#1260](https://github.com/darthjee/majora/issues/1260) for the Lootstudios
crawler effort tracking issue.
