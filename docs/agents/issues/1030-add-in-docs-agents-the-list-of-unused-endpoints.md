# Issue: Add a docs/agents doc listing backend endpoints unused by the frontend

## Description

Backend endpoints are sometimes built ahead of their frontend integration, or as part of an
initiative whose frontend work later stalls. Once merged, these endpoints have no visibility
anywhere — nothing distinguishes them from endpoints already fully wired into the product. We
need a documentation file under `docs/agents` that lists these unused endpoints so the
initiatives behind them aren't forgotten.

## Problem

There is currently no record of which registered backend routes are actually consumed by the
frontend and which were created but never (or not yet) wired up. Without this, an endpoint built
for a stalled or paused initiative is indistinguishable from dead code, and the context of why
it exists risks being lost over time.

## Solution

### Detection Method

Unused endpoints are found in a **script-assisted, human-curated** way:

- The script is a **Python Django management command**, e.g.
  `backend/games/management/commands/list_unused_endpoints.py`, run via
  `docker-compose run --rm majora_be python manage.py list_unused_endpoints`. It reuses Django's
  own URL resolver to enumerate registered routes accurately (rather than reimplementing route
  parsing), and reads the relevant frontend files as plain text for the cross-reference.
- It parses all registered DRF routes (from `backend/majora_project/urls.py` and the apps it
  includes) and cross-references them against how the frontend actually calls endpoints.
- The frontend calls endpoints two ways, and the script must account for both when deciding
  what counts as "used":
  1. **Hardcoded paths** in per-resource clients under `frontend/assets/js/client/` (e.g.
     `GameClient.fetchGame` -> `/games/${slug}.json`).
  2. **Config-driven paths** issued dynamically through `RequestStore.mutate()`, declared in
     `frontend/assets/js/utils/requests/resourceConfig.js` rather than as literal strings.

  The script unions both sources as "used" and diffs that against the full set of registered
  backend routes to produce candidate unused endpoints.
- The script's output is candidates only. A human (or agent) reviews each candidate and writes
  the narrative a script can't infer — why it's unused, which initiative/issue it belongs to,
  and any relevant context — before adding it to the doc.

### Scope

- Candidates are drawn from every route registered in `backend/majora_project/urls.py` across
  all included apps (`games` — nesting `conversations`, `permissions`, `treasures`, etc. under
  `backend/games/urls/` — `staff`, `accounts`, `miniatures`), excluding Django's own `/admin/`.
- Staff-only endpoints (`backend/staff/urls.py`) are in scope like any other: the Staff dashboard
  is part of the same React frontend, not a separate consumer to special-case.
- Navi (the cache-warmer) calling an endpoint per `navi/navi_config.yaml` does **not** count as
  usage — if the frontend itself never calls the endpoint, it still counts as unused.

### Doc Format & Placement

- New file: `docs/agents/unused-endpoints.md`.
- One table row per unused endpoint, with columns: **Endpoint** (path + HTTP method),
  **Module/App**, **Initiative** (originating issue/PR), **Why unused** (short human-written
  note).
- Wired up like every other doc under `docs/agents`: linked from `docs/agents/index.md` (new
  section, or folded into "Plans & Issues"), with a 2-4 line abstract added to
  `docs/agents/summary.md`.
- `docs/agents/unused-endpoints.md` itself must include a short "How to regenerate" section
  documenting the exact command to re-run the detection script (e.g.
  `docker-compose run --rm majora_be python manage.py list_unused_endpoints`), so anyone (human
  or agent) reading the doc can refresh the candidate list without hunting for the script.

### Maintenance

- No new CI machinery. Freshness is kept by the same manual-discipline convention the project
  already uses for its other docs: add a line to `docs/agents/contributing.md`'s Definition of
  Done stating that any PR which adds a new backend endpoint, or newly wires up a previously
  unused one to the frontend, must update `docs/agents/unused-endpoints.md` accordingly.
- The detection script can still be re-run by hand at any time to catch drift, but that's a
  manual aid, not an enforced gate.

### Initial Population

This issue's Definition of Done includes actually running the script and populating
`docs/agents/unused-endpoints.md` with today's real unused endpoints, reviewed and annotated
with their initiative/reason — not just delivering the tooling with an empty doc.

## Benefits

- Backend work built ahead of its frontend integration stays visible and traceable to its
  originating initiative instead of silently looking like dead code.
- Gives the team (and future agents) a single place to check before starting new frontend work,
  to see if a backend endpoint already exists for it.
- Keeps the project's existing docs-discovery convention (index.md/summary.md) consistent as new
  documentation is added.
