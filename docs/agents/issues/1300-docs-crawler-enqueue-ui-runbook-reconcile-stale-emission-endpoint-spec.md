# Issue: Docs: crawler Enqueue UI runbook + reconcile stale emission-endpoint spec

## Description

Part of #1291 (the Lootstudios Enqueue feature). #1291 added an interactive
alternative to the headless whole-catalog Lootstudios crawler run (`npx
navi-hey --config crawler/navi_config.yaml`): a Navi extension (backend route
#1295 + frontend page #1296) baked into a derived `darthjee/navi-hey` image
(#1298's `crawler_navi_web` compose service,
`dockerfiles/navi_hey_loot_enqueue/Dockerfile`), with a page that takes one
Lootstudios collection URL and an "Enqueue" button that fires a real Navi
queue job to crawl just that collection. #1297 fixed the import endpoints'
status codes and #1299 added the extension's Jasmine suite plus the
`crawler_extension_tests` CI job. All of #1291's other sub-issues
(#1292–#1299) have already landed; this is the last sub-issue, landing
**after** the feature is fully built, to document it.

## Problem

Several docs now contradict or omit what actually shipped:

- `crawler/README.md` still describes the crawler as "Scaffold today — no
  crawling logic," says "no dependencies are declared yet," and lists
  "CI/dev tooling wiring … explicitly out of scope … entirely" — all stale
  now that #1291's extension ships with its own dependencies, the
  `crawler_navi_web` compose service, and the `crawler_extension_tests` CI
  job.
- `crawler/RUNNING.md` documents only the headless whole-catalog run; it has
  no mention of the new interactive per-collection Enqueue mode at all.
- Neither doc reflects #1289's finding that `GetMyLootsCache` needs no auth
  (`LOOTSTUDIOS_SESSION_COOKIE` is sent defensively only) — confirmed
  resolved in `docs/agents/specs/loot-crawling/source-to-collections.md`'s
  "Open question 1."
- `docs/agents/specs/loot-crawling/emission-endpoint.md` still calls
  `stl_models/import.json` the "ONLY emission target" and states "there is
  no standalone Collection-creation call" — both wrong since #1281 added
  `POST /miniatures/collections/import.json`, which `crawler/navi_config.yaml`
  already uses (and which the SUB-1 spec's own bundle pass calls too).
- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md` (the
  SUB-1 contract spec) itself says "#1300 will patch those stale claims when
  it retires this page" — but nothing retires or flags it yet.
- No cross-reference exists between the SUB-1 spec's on-demand *input* UI and
  `crawler-test-harness.md`'s *output*-side debug harness, even though both
  are Lootstudios-crawler-adjacent tooling a reader could confuse.
- `AGENTS.md` and the `crawler`/`infra` specialist agent definitions don't
  mention the new surface area: `.claude/agents/crawler.md` still says the
  crawler is "currently a bare scaffold... no crawling logic, dependencies,
  or CI/docker-compose wiring exist yet" (also stale — #1295/#1296 added real
  `crawler/navi-extension/` code, #1298 added `crawler_navi_web` and
  `dockerfiles/navi_hey_loot_enqueue/Dockerfile`, #1299 added
  `crawler_extension_tests`), and `.claude/agents/infra.md`'s
  Services/Dockerfiles/CI-jobs tables list neither the new compose service
  nor the new CI job.

## Expected Behavior

- `crawler/README.md` and `crawler/RUNNING.md` describe both run modes
  (headless whole-catalog and interactive per-collection Enqueue) accurately,
  with no stale "scaffold"/"no dependencies"/"CI wiring out of scope"
  language.
- `emission-endpoint.md` lists both emission targets and drops the "no
  standalone Collection-creation call" claim.
- The SUB-1 spec (`interactive-collection-enqueue.md`) carries a note
  flagging it for future removal — see "Decisions from discussion" below for
  why it isn't deleted outright in this issue.
- `crawler-test-harness.md` and `interactive-collection-enqueue.md`
  cross-reference each other as complementary input/output tooling.
- `AGENTS.md`, `.claude/agents/crawler.md`, and `.claude/agents/infra.md`
  reflect the new `crawler_navi_web` service, the
  `dockerfiles/navi_hey_loot_enqueue/Dockerfile`, and the
  `crawler_extension_tests` CI job.

## Solution

- **`crawler/README.md` / `crawler/RUNNING.md`**: add the interactive mode —
  build `crawler/navi-extension/dist/`, `docker compose up crawler_navi_web`,
  open the page (bound to `127.0.0.1:3110` per #1298), paste a Lootstudios
  collection/bundle URL, hit Enqueue, watch the job on Navi's stock
  Jobs/Logs screens (`GET /jobs/:status.json`, `GET /emissions.json`, per
  `interactive-collection-enqueue.md`'s "Deferred / out of scope"). Drop the
  stale "Scaffold today — no crawling logic," "no dependencies are declared
  yet," and "CI/dev tooling wiring … out of scope … entirely" language from
  `README.md`'s "Explicitly out of scope for now" section. Fold in #1289's
  finding that `GetMyLootsCache` needs no auth (the session cookie is sent
  defensively only) into `RUNNING.md`'s "Obtaining/refreshing the Lootstudios
  session" section, referencing `source-to-collections.md`'s now-resolved
  "Open question 1."
- **`docs/agents/specs/loot-crawling/emission-endpoint.md`**: patch "The
  emission target" section — list `POST /miniatures/collections/import.json`
  (#1281) alongside `POST /miniatures/stl_models/import.json` (#1262) as
  emission targets instead of calling the latter the "ONLY" one, and
  drop/correct the "there is no standalone Collection-creation call"
  sentence.
- **`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`**:
  add a note at the top marking it pending removal in a future cleanup pass
  (per `docs/agents/specs.md`'s "removed once the feature area is fully
  implemented" convention), and add a matching note next to its entry in
  `docs/agents/specs/loot-crawling.md`'s aspect-page list, without removing
  either the page or the listing yet.
- **Cross-reference**: add one line each in `interactive-collection-enqueue.md`
  and `crawler-test-harness.md` noting they're complementary tools — one an
  *input* UI inside Navi, the other an *output*-side debug harness inside
  Majora.
- **`AGENTS.md`**: note the new `crawler_navi_web` compose service and the
  `crawler_extension_tests` CI job.
- **`.claude/agents/crawler.md`**: update the "Purpose" section's stale
  "currently a bare scaffold ... no crawling logic, dependencies, or
  CI/docker-compose wiring exist yet" line — the scaffold now has the
  `crawler/navi-extension/` Node project with real dependencies (#1295,
  #1296).
- **`.claude/agents/infra.md`**: add `crawler_navi_web` to the Services
  table, `dockerfiles/navi_hey_loot_enqueue/` to the Dockerfiles table, and
  `crawler_extension_tests` to the CI jobs table.

### Decisions from discussion

- The SUB-1 spec page is **flagged, not deleted**, in this issue — actual
  removal of `interactive-collection-enqueue.md` (and its `loot-crawling.md`
  listing) is deferred to a later cleanup pass.
- This issue's spec-doc changes stay scoped to `emission-endpoint.md` and the
  SUB-1 page's own #1291-related staleness; other independently-stale
  content elsewhere in `loot-crawling/` (e.g. `model-changes.md`'s own
  "#1262 is still open" claim, which contradicts `crawler/RUNNING.md`) is
  left for a separate follow-up issue rather than folded in here.

**Files**: `crawler/README.md`, `crawler/RUNNING.md`,
`docs/agents/specs/loot-crawling/emission-endpoint.md`,
`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`,
`docs/agents/specs/loot-crawling.md`,
`docs/agents/specs/crawler-test-harness.md`, `AGENTS.md`,
`.claude/agents/crawler.md`, `.claude/agents/infra.md`.

Owner: **architect** (cross-cutting docs, spans `crawler/`, `docs/agents/`,
and both `crawler`/`infra` agent definitions). Depends on: all of #1291's
prior sub-issues (#1292–#1299, already landed). Blocks: nothing — this is
the closing sub-issue of #1291.

## Benefits

The runbook accurately reflects both ways to run the Lootstudios crawler,
`emission-endpoint.md` no longer contradicts the two emission endpoints that
actually exist, the SUB-1 spec is clearly marked for its eventual retirement
instead of silently lingering past #1291's completion, and the
`crawler`/`infra` agent definitions match the actual repo surface they're
responsible for.
