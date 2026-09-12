# Plan: Docs: crawler Enqueue UI runbook + reconcile stale emission-endpoint spec

Issue: [1300-docs-crawler-enqueue-ui-runbook-reconcile-stale-emission-endpoint-spec.md](../issues/1300-docs-crawler-enqueue-ui-runbook-reconcile-stale-emission-endpoint-spec.md)

## Overview

#1291 (the Lootstudios Enqueue feature) is fully built — #1292–#1299 already
landed a Navi extension (backend route, frontend page, derived image, compose
service, CI job) that lets a maintainer crawl one Lootstudios collection
on-demand, alongside the pre-existing headless whole-catalog run. This is the
closing sub-issue: it reconciles every doc that still describes the
pre-#1291 world (or, in `emission-endpoint.md`'s case, a pre-#1281 one) with
what actually shipped. This is a docs-only change spanning `crawler/`,
`docs/agents/specs/`, `AGENTS.md`, and two agent definition files — no
specialist agent's implementation scope is at play (updating `crawler/*.md`
prose is not "crawling logic"), so it is owned by the architect as a
cross-cutting documentation task, matching the issue's own "Owner:
architect" line.

## Context

- The interactive Enqueue mode: build `crawler/navi-extension/dist/`, `docker
  compose up crawler_navi_web` (bound to `127.0.0.1:3110`, #1298), open the
  page, paste a Lootstudios collection/bundle URL, click Enqueue — the
  extension backend route (#1295) resolves the slug, pushes a per-collection
  Navi resource, and starts it; progress/failures surface on Navi's stock
  Jobs/Logs screens (no live-status UI was built — see
  `interactive-collection-enqueue.md`'s "Deferred / out of scope"). The
  headless whole-catalog run (`npx navi-hey --config
  crawler/navi_config.yaml`) is unchanged and stays primary.
- `crawler/README.md` still says "Scaffold today — no crawling logic," "no
  dependencies are declared yet," and "CI/dev tooling wiring … out of scope
  … entirely" — all stale now that `crawler/navi-extension/` (#1295/#1296)
  has real dependencies, plus `crawler_navi_web` (#1298) and
  `crawler_extension_tests` (#1299).
- `crawler/RUNNING.md` documents only the headless run and doesn't reflect
  #1289's finding that `GetMyLootsCache` needs no auth (confirmed in
  `docs/agents/specs/loot-crawling/source-to-collections.md`'s "Open question
  1: Status: resolved — no auth required" — `LOOTSTUDIOS_SESSION_COOKIE` is
  sent defensively only).
- `docs/agents/specs/loot-crawling/emission-endpoint.md`'s "The emission
  target" section calls `POST /miniatures/stl_models/import.json` the "ONLY"
  emission target and says "there is no standalone Collection-creation
  call" — both wrong since #1281 added `POST
  /miniatures/collections/import.json`, already used by
  `crawler/navi_config.yaml` and by `interactive-collection-enqueue.md`'s own
  bundle pass.
- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md` (the
  SUB-1 contract spec) says "#1300 will patch those stale claims when it
  retires this page" — per the discuss-issue dialogue on #1300, **do not
  delete it in this issue**: flag it as pending removal instead, and leave
  the actual retirement (and any broader sweep of other `loot-crawling/`
  pages' unrelated staleness, e.g. `model-changes.md`'s own "#1262 is still
  open" claim) to a later cleanup pass.
- `AGENTS.md` and the `crawler`/`infra` agent definitions
  (`.claude/agents/crawler.md`, `.claude/agents/infra.md`) don't mention the
  new surface area at all.

## Implementation Steps

### Step 1 — Update the crawler runbook for the interactive Enqueue mode

In `crawler/README.md`:

- Drop the stale "Scaffold today — no crawling logic lives directly in this
  package yet" opening line and the "Explicitly out of scope for now"
  section's "no dependencies are declared yet" and "CI/dev tooling wiring …
  explicitly out of scope for the Lootstudios crawler entirely" bullets —
  `crawler/navi-extension/` now has real dependencies, a compose service, and
  a CI job.
- Add a short pointer to the interactive mode alongside the existing
  headless-run pointer, directing readers to `RUNNING.md` for the full
  runbook of both modes.

In `crawler/RUNNING.md`:

- Add a new `##` section (after "Running it") documenting the interactive
  per-collection Enqueue mode: build `crawler/navi-extension/dist/`, `docker
  compose up crawler_navi_web`, open the page at `http://127.0.0.1:3110`
  (#1298), paste a `https://app.lootstudios.com/bundle/<slug>/` URL, click
  Enqueue, and watch the job via Navi's stock Jobs/Logs screens. Note the
  route contract's response cases (`200`/`400`/`404`/`502`, per
  `interactive-collection-enqueue.md`'s "Route contract") so a maintainer
  knows what a failed Enqueue looks like.
- In "Obtaining/refreshing the Lootstudios session," fold in #1289's
  resolved finding: `GetMyLootsCache` needs no auth at all;
  `LOOTSTUDIOS_SESSION_COOKIE` is sent defensively only, in case that ever
  changes. Cross-reference `source-to-collections.md`'s now-resolved "Open
  question 1" rather than repeating it as still-open.

### Step 2 — Reconcile stale spec pages and sync AGENTS.md / agent definitions

In `docs/agents/specs/loot-crawling/emission-endpoint.md`'s "The emission
target" section: change "the **only** emission target for this crawler" to
list both `POST /miniatures/stl_models/import.json` (#1262) and `POST
/miniatures/collections/import.json` (#1281), and drop/correct the "There is
**no** standalone Collection-creation call" sentence (#1281 added exactly
that).

In `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`: add a
short note near the top (e.g. under the existing "temporary" sentence) that
this page is now pending removal in a future cleanup pass, since #1291 is
fully implemented as of this issue landing — do not delete the file or its
listing yet (per the discuss-issue decision in Context). Add a matching
"(pending removal)" note next to its entry in `docs/agents/specs/loot-crawling.md`'s
`## Aspect pages` list, without removing the entry.

Cross-reference: add one sentence each in
`interactive-collection-enqueue.md` and
`docs/agents/specs/crawler-test-harness.md` noting they're complementary
tools for the same crawler effort — one an on-demand *input* UI inside Navi,
the other an *output*-side debug harness inside Majora for inspecting what a
run emits.

In `AGENTS.md`: add the `crawler_navi_web` compose service and the
`crawler_extension_tests` CI job to wherever the doc set already tracks
per-service/per-job references (follow the existing style/location for
similar entries).

In `.claude/agents/crawler.md`: replace the "Purpose" section's "It is
currently a bare scaffold (`crawler/package.json`, `crawler/README.md`) — no
crawling logic, dependencies, or CI/docker-compose wiring exist yet. That
comes in a follow-up implementation issue." with an accurate description:
`crawler/navi-extension/` now holds a real Node project (backend route +
frontend page, #1295/#1296) with its own dependencies, baked into a derived
image and CI job owned by `infra`.

In `.claude/agents/infra.md`: add a `crawler_navi_web` row to the Services
table (image: the derived `dockerfiles/navi_hey_loot_enqueue/Dockerfile`,
port `127.0.0.1:3110`, purpose: Lootstudios Enqueue UI), a
`dockerfiles/navi_hey_loot_enqueue/` row to the Dockerfiles table, and a
`crawler_extension_tests` row to the CI jobs table (mirroring
`proxy_extension_tests`'s row shape).

## Files to Change

- `crawler/README.md` — drop stale scaffold/no-dependencies/CI-out-of-scope
  language; point to the interactive mode.
- `crawler/RUNNING.md` — add the interactive Enqueue mode section; fold in
  the resolved no-auth finding.
- `docs/agents/specs/loot-crawling/emission-endpoint.md` — patch "The
  emission target" section for #1281's endpoint.
- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md` — add
  a pending-removal note; add the crawler-test-harness cross-reference.
- `docs/agents/specs/loot-crawling.md` — add a pending-removal note next to
  the SUB-1 aspect-page listing.
- `docs/agents/specs/crawler-test-harness.md` — add the
  interactive-collection-enqueue cross-reference.
- `AGENTS.md` — note the new compose service and CI job.
- `.claude/agents/crawler.md` — replace the stale "bare scaffold" Purpose
  wording.
- `.claude/agents/infra.md` — add the new service, Dockerfile, and CI job to
  their respective tables.

## CI Checks

- repo root: `yarn lint_md` (CI job: `markdownlint`) — run via a container
  per AGENTS.md, e.g. `docker-compose run --rm majora_fe yarn lint_md`.

## Notes

- Per the discuss-issue dialogue: stay scoped to `emission-endpoint.md` and
  the SUB-1 page's own #1291-related staleness. Do not delete
  `interactive-collection-enqueue.md` or sweep other independently-stale
  `loot-crawling/` pages (e.g. `model-changes.md`) — those are left for a
  separate follow-up issue.
- No code, config, or CI changes — this issue is prose-only.
