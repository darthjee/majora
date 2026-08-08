# Plan: Add a docs/agents doc listing backend endpoints unused by the frontend

Issue: [1030-add-in-docs-agents-the-list-of-unused-endpoints.md](../issues/1030-add-in-docs-agents-the-list-of-unused-endpoints.md)

## Overview

Add a new Django management command that enumerates every registered backend route, cross-references it against how the frontend actually calls endpoints (both hardcoded client paths and `resourceConfig.js`-driven dynamic paths), and prints the routes with no matching frontend usage. Use its output to write a new `docs/agents/unused-endpoints.md`, populated with today's real candidates and annotated by hand with why each is unused and which initiative it belongs to. Wire the new doc into the project's existing doc-discovery convention and record the upkeep expectation in `contributing.md`.

## Context

Backend endpoints are sometimes built ahead of their frontend integration, or as part of an initiative whose frontend work later stalls. Once merged, nothing distinguishes them from endpoints already fully wired into the product, so the initiative behind them risks being forgotten. See the issue file for the full detection-method, scope, and maintenance decisions reached during discussion.

## Implementation Steps

### Step 1 — Enumerate registered backend routes

Write `backend/games/management/commands/list_unused_endpoints.py` (a standard
`django.core.management.base.BaseCommand`). Use Django's own URL resolver
(`django.urls.get_resolver()`, walking `url_patterns`) against
`backend/majora_project/urls.py` to enumerate every registered route across all included apps
(`games` — which itself nests `conversations`, `permissions`, `treasures`, etc. under
`backend/games/urls/` — `staff`, `accounts`, `miniatures`), excluding Django's own `/admin/`.
For each route, capture at least: URL pattern (with its path converters, e.g.
`<slug:game_slug>`), allowed HTTP method(s), and the app/module it belongs to (derived from
the view's module path).

### Step 2 — Cross-reference against frontend usage

In the same command, read the relevant frontend source as plain text (no JS tooling required)
and mark a route as "used" if either of these finds a match:

1. **Hardcoded paths** — literal template-string paths in `frontend/assets/js/client/*.js`
   (e.g. `` `/games/${slug}.json` ``). Normalize Django path converters and JS template
   placeholders to a common wildcard form before comparing (e.g. both
   `<slug:game_slug>` and `${gameSlug}` become a single wildcard segment) so structurally
   equivalent paths match regardless of naming.
2. **Config-driven paths** — path templates declared in
   `frontend/assets/js/utils/requests/resourceConfig.js` and the per-resource files it imports
   from `frontend/assets/js/utils/requests/config/*.js` (each `path` entry is a function
   returning a template string — parse the literal template out of the function body with the
   same normalization as above).

Union both sources as "used" and diff against the full route list from Step 1. Print the
remaining (unused) routes as the command's output — this is the **candidate list**, not the
final doc content.

### Step 3 — Add a test for the command

Add `backend/games/tests/management/commands/list_unused_endpoints_test.py` (new
`management/commands/` test tree, mirroring the new source tree per the project's test-mirroring
convention). Cover at minimum: a route only reachable via a hardcoded client path is excluded
from the output; a route only reachable via `resourceConfig.js` is excluded from the output; a
route matching neither is included; `/admin/` is never included regardless of match.

### Step 4 — Run the command and curate the doc

Run `docker-compose run --rm majora_be python manage.py list_unused_endpoints` (or the
project's equivalent local invocation) to get today's real candidate list. For each candidate,
review it by hand and write the narrative the script can't infer — which initiative/issue it
belongs to and why it's still unused (check git blame / the issue tracker for context where
needed).

### Step 5 — Write `docs/agents/unused-endpoints.md`

Create the doc with:

- One table row per unused endpoint reviewed in Step 4, columns: **Endpoint** (path + HTTP
  method), **Module/App**, **Initiative** (originating issue/PR), **Why unused**.
- A "How to regenerate" section documenting the exact command from Step 4, so anyone (human or
  agent) can refresh the candidate list later without hunting for the script.

Follow `docs/agents/documentation.md`'s formatting rules (blank line before/after every heading
and every list).

### Step 6 — Wire the doc into the discovery convention

- Add a link to `docs/agents/unused-endpoints.md` in `docs/agents/index.md` (new section, or
  folded into "Plans & Issues" — pick whichever reads better once the section exists).
- Add a 2-4 line abstract in `docs/agents/summary.md`, matching the style of the other entries.

### Step 7 — Record the upkeep convention

Add a line to `docs/agents/contributing.md`'s "Definition of Done" list stating that any PR
which adds a new backend endpoint, or newly wires up a previously unused one to the frontend,
must update `docs/agents/unused-endpoints.md` accordingly.

## Files to Change

- `backend/games/management/__init__.py` — new (package init, if not already present).
- `backend/games/management/commands/__init__.py` — new (package init).
- `backend/games/management/commands/list_unused_endpoints.py` — new; the detection command
  (Steps 1-2).
- `backend/games/tests/management/__init__.py` — new (package init).
- `backend/games/tests/management/commands/__init__.py` — new (package init).
- `backend/games/tests/management/commands/list_unused_endpoints_test.py` — new; command tests
  (Step 3).
- `docs/agents/unused-endpoints.md` — new; the populated doc (Step 5).
- `docs/agents/index.md` — edit; link the new doc (Step 6).
- `docs/agents/summary.md` — edit; abstract for the new doc (Step 6).
- `docs/agents/contributing.md` — edit; add the Definition of Done bullet (Step 7).

## CI Checks

- `backend/`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .` (CI jobs:
  `pytest_all`, `checks`).
- `docs/agents/` markdown has no local check — get blank-line formatting right by eye per
  `docs/agents/documentation.md` (only enforced by Codacy on the PR).

## Notes

- Matching JS template-literal paths against Django path converters is the trickiest part of
  Step 2 — keep the normalization logic isolated and well-tested so it's easy to extend if a
  new placeholder shape shows up later.
- The command's output is only a candidate list; the actual doc content (initiative + reason
  columns) requires human judgment and cannot be fully automated — budget time for that review
  in Step 4.
