# Plan: Spec: interactive per-collection Enqueue aspect page for the Lootstudios crawler

Issue: [1292-spec-interactive-per-collection-enqueue-aspect-page-for-the-lootstudios-crawler.md](../issues/1292-spec-interactive-per-collection-enqueue-aspect-page-for-the-lootstudios-crawler.md)

## Overview

Write one temporary spec aspect page,
`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`, and link it
from `docs/agents/specs/loot-crawling.md`. The page fixes the contract that the
other #1291 sub-issues (#1294 web config, #1295 backend route, #1296 frontend
page) build against, so it must land first. This is a docs-only change — no
specialist agent has implementation work; it is owned by the architect as a
cross-cutting design doc.

## Context

#1291 adds an interactive alternative to the headless whole-catalog crawler
(`crawler/navi_config.yaml`, run via `npx navi-hey`): a Navi *extension*
(backend route + frontend page) baked into a derived `darthjee/navi-hey` image,
with a page that takes one Lootstudios collection URL and an "Enqueue" button
that fires a real Navi queue job to crawl just that collection (extract STL
models, emit to Majora via `POST /miniatures/collections/import.json` #1281 and
`POST /miniatures/stl_models/import.json` #1262). The headless run stays
byte-identical and primary; the new mode is additive and local-maintainer-run.

Design facts already established (carry these into the spec verbatim rather than
re-deriving):

- **Navi has no parameterized runtime enqueue.** Per Navi's upstream
  `docs/agents/web-server.md`: `POST /api/engine/start` takes
  `{ targets?: [{ namespace, resources? }] }`; `PATCH /engine/start` takes
  `{ resources?: [string] }`. Both accept resource **names** only. The only way
  to introduce a collection-specific URL at runtime is `POST /api/config`
  (`{ namespace, resources?, clients? }`), which merges a whole
  resource/client definition into a namespace and stores it **literally** — no
  `$VAR` / `${VAR}` resolution. Other runtime controls: `GET /engine/status`,
  `PATCH /engine/pause` / `continue` / `stop` / `restart`, `POST /api/engine/stop`.
  Only the `/api/*` namespace is token-secured (`web.api.token`); the
  non-prefixed `/engine/*` routes are not.
- **Enqueue mechanism (fixed):** the extension backend handler builds a full
  per-collection Navi resource with the concrete slug/URL baked into the `url`
  (and any `emit` `body_template`) tokens, `POST /api/config`s it under a
  per-enqueue namespace, then starts it (`POST /api/engine/start` scoped via
  `targets`, or `PATCH /engine/start`).
- **Concurrency:** each Enqueue becomes a real job in Navi's worker pool, so
  enqueues run in parallel (bounded by `workers.quantity` in the #1294 web
  config). No serialization is layered on top.
- **Namespace / resource identity (pinned by this spec, not deferred to #1295):**
  every Enqueue must push under a namespace/resource name that is **unique per
  enqueue** (e.g. `enqueue_<slug>_<discriminator>`), so a second
  `POST /api/config` can never clobber a resource that is still queued or
  running.
- **Engine lifecycle:** `web.autostart: false` — the derived image boots with the
  engine paused; each Enqueue's start call drives it. Name the env var that
  carries `web.api.token`.
- **Security posture:** Navi extension backend routes are public — no token
  wiring. The enqueued work carries the container's staff/admin
  `MAJORA_API_TOKEN`. Mitigation on record: local-maintainer-run only, not
  deployed, port bound to localhost. No auth layer is added.
- **Extraction:** already specified in
  `docs/agents/specs/loot-crawling/collection-to-stl-models.md` (Approach A:
  filter `GetMyLootsCache` by `obj_slug`). Reference it; do not re-derive.
- **Do not repeat** `docs/agents/specs/loot-crawling/emission-endpoint.md`'s
  stale claims ("stl_models import is the ONLY emission target", "no standalone
  Collection-creation call") — #1281 added `POST /miniatures/collections/import.json`
  and `crawler/navi_config.yaml` already uses it. #1300 patches that page.
- **Deferred:** the 201-on-create vs `emit.status: 200` mismatch is fixed in
  #1297; the spec only notes it.
- **Upstream:** `darthjee/navi#828` proposes a real parameterized runtime
  enqueue; cross-reference it as the non-blocking "do it properly" follow-up that
  would later simplify #1295.
- **Spec lifecycle:** per `docs/agents/specs.md`, aspect pages are removed once
  the feature area is fully implemented — #1300 retires this one.

## Implementation Steps

### Step 1 — Write the aspect page

Create `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`.
Follow the observed structure of the sibling pages in `loot-crawling/`: an
intro paragraph, then `##` sections, each cross-referencing sibling pages and the
originating issue numbers (#1291 and its sub-issues). Required sections:

1. **Overview / scope** — what the interactive Enqueue mode is, how it sits
   alongside the unchanged headless run, and that this page is the contract for
   #1294 / #1295 / #1296. State it is temporary (retired by #1300).
2. **Enqueue mechanism** — the `POST /api/config` + engine-start flow, spelled
   out step by step: what the handler receives, what resource payload it
   synthesizes (name the tokens it substitutes), the `POST /api/config` call
   shape, the engine-start call shape, and what "done" looks like (job drains,
   emissions succeed). Include the finding that Navi has no parameterized enqueue
   and why `POST /api/config` is the mechanism.
3. **Namespace / resource identity** — the exact per-enqueue naming scheme
   (unique per enqueue; give the format), and the decision on whether the pushed
   resource **references** the `lootstudios` / `majora_api` clients already
   loaded from `navi_config.web.yaml` or **re-pushes** concrete client
   definitions with the handler substituting real token/cookie values (because
   `/api/config` does no env-var resolution). Pick one and state it; if it
   depends on a Navi merge-semantics detail the author cannot confirm from
   `web-server.md`, check the Navi source/repo and record the answer here.
   Cover idempotency / behaviour of re-enqueuing the same collection.
4. **Concurrency** — enqueues run in parallel via the worker pool; state the
   expected `workers.quantity` for the #1294 web config and that nothing
   serializes on top of Navi.
5. **Route contract** — the `POST /ext/<path>/enqueue.json` route: exact path,
   request body (the collection URL / slug field, accepted forms, validation
   rules — reject anything that is not an `app.lootstudios.com/bundle/<slug>/`
   URL, derive the slug), and the success and error response JSON. This is what
   #1295 implements and #1296 calls.
6. **Engine lifecycle & config** — `web.autostart: false`; the `web.api.token`
   env var name; how the derived image passes it (defers concrete compose wiring
   to #1298).
7. **Security posture** — the public-route / `MAJORA_API_TOKEN`-in-env statement
   and the local-only mitigation. No auth added.
8. **Extraction** — one paragraph pointing at
   `collection-to-stl-models.md` (Approach A) and
   `emission-endpoint.md` for the import payloads; explicitly flag the stale
   claims in `emission-endpoint.md` as fixed by #1300 so this page is not read
   as endorsing them.
9. **Deferred / out of scope** — the 201/200 mismatch (#1297); no live
   run-status UI on the page (#1296 is form-only); no deploy.
10. **Upstream** — cross-reference `darthjee/navi#828`.
11. **Acceptance criteria** — feature-level checks for #1291 (enqueue a real
    bundle URL → one job runs to completion with no dead-letter → the
    `Collection` and its `StlModel`s appear in Majora's miniatures API →
    re-enqueue is an update, not a duplicate → the headless whole-catalog run
    still works unchanged).

Prose in English; wrap at ~80 columns and otherwise match the markdown style of
the sibling aspect pages so `markdownlint-cli2` passes.

### Step 2 — Link the page from the spec index

Add a bullet to the `## Aspect pages` list in
`docs/agents/specs/loot-crawling.md`, matching the existing entry format:

```markdown
- [Interactive per-collection Enqueue](loot-crawling/interactive-collection-enqueue.md)
```

## Files to Change

- `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md` — new
  aspect page (the deliverable).
- `docs/agents/specs/loot-crawling.md` — add the new page to the `## Aspect
  pages` list.

## CI Checks

- repo root: `yarn lint_md` (CI job: `markdownlint`) — run via a container per
  AGENTS.md, e.g. `docker-compose run --rm majora_fe yarn lint_md`.

## Notes

- The exact request/response JSON of Navi's `/api/*` and `/engine/*` routes
  beyond method + top-level body shape is not in this repo (`web-server.md` lives
  in `darthjee/navi`). If Step 1 needs more than the shapes recorded in Context,
  read the Navi repo directly rather than guessing.
- Whether a `POST /api/config` resource can reference a client loaded earlier
  from the entry config (vs. having to re-declare it in the same payload) is the
  one merge-semantics unknown; resolving it decides Step 1 section 3's
  client-handling choice. Verify against Navi source; if still ambiguous, the
  spec should mandate re-pushing concrete client definitions (safe default) and
  note the open question.
- No code, config, or CI is changed by this issue — those are #1293–#1300.
- Keep the page scoped to the contract; do not pre-empt #1295's implementation
  detail beyond the identity scheme the issue explicitly asks this spec to pin.
