# Issue: Frontend — /#/staff/crawler two-column debug page

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler).
Implements the frontend half of the temporary crawler emission debug harness
specified in the sibling sub-issue "Spec: Crawler emission debug harness",
consuming the endpoint built in the sibling sub-issue "Backend — implement
/staff/crawler.json debug endpoint". Depends on both landing first (the record
shape and the actual endpoint to call).

## Problem

Once the crawler can POST raw scraped JSON to the debug endpoint, staff need a
way to actually look at it — paginated, newest activity visible, full JSON per
record for debugging extraction correctness before trusting it against the real
import endpoint.

## Scope

### Route and access gating

New route `/#/staff/crawler` (page key e.g. `staffCrawler`) in
`frontend/assets/js/utils/routing/HashRouteResolver.js`, a new `PAGES` entry in
`frontend/assets/js/components/helpers/AppHelper.jsx`, a new
`accessRouteConfig.js` entry (`{ kind: 'staffOrSuperuser' }`), and a page
controller that calls `AccessStore.ensureStaffOrSuperUser()` and redirects away
if not allowed — follow
`frontend/assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js`
exactly.

### New resource folder

`frontend/assets/js/components/resources/crawler/pages/...` (controllers/ +
helpers/ subfolders), per `docs/agents/frontend/directory-structure.md`'s
per-resource convention — mirrors `staff_dashboard/`.

### Layout: two columns

- **Left column** — a growing, newest-at-the-bottom list of records (a
  `tail -f`-style log feed, per the spec's wire contract — **not** a
  scroll-to-load-older infinite scroll). The backend's `last_id` cursor only
  moves forward (newer), so there is no backward/older cursor to page into on
  scroll. The correct client shape is a **drain-then-poll loop**: on mount,
  fetch with no `last_id` (returns from the start of the retained window),
  then keep re-fetching with the newest returned `id` as `last_id` for as long
  as a full page comes back (draining the whole retained history), then
  switch to polling **every 10 seconds** once a fetch returns fewer than a
  full page (caught up) — closer to `SessionMessagesController`'s
  cursor-tracking style
  (`frontend/assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js`)
  than `DocumentPagesBox`'s lazy scroll-to-load pattern. The visible result
  still reads as a growing, auto-scrolling list: auto-scroll to the bottom on
  new arrivals, like a live log tail, **except while the user has manually
  scrolled up** to inspect older records — auto-scroll pauses in that case
  (new rows still arrive and append in the background) and only resumes once
  the user scrolls back to the bottom themselves, so a live feed never yanks
  the view away from whatever they're reading. Each row shows enough to
  identify the record at a glance (id, timestamp, `source` tag, `type` tag).
- **Right column** — the selected record's full JSON, pretty-printed
  (`<pre>{JSON.stringify(record, null, 2)}</pre>` as the baseline; no existing
  JSON-viewer component in this codebase to reuse — no `react-json-view`,
  `prismjs`, `highlight.js`, etc. in `package.json`).

### Tests

Mirror existing spec conventions
(`frontend/specs/assets/js/components/resources/staff_dashboard/...`): one spec
file per component/controller, controllers get one spec file per public method
in a folder named after the controller class, plus a `support.js` for shared
setup.

## Explicitly out of scope

- Any backend work (sibling sub-issue "Backend — implement
  /staff/crawler.json debug endpoint").
- The `/#/staff/dashboard` summary card (sibling sub-issue "Frontend —
  /#/staff/dashboard crawler summary card", #1276) and the endpoints it
  consumes (#1275) — this page has no clear/summary UI of its own.
- Filtering/searching the list by `source`/`type` (the tags exist on the
  record for future use, but no filter UI is required yet).
- Removing this page once the harness is retired (tracked as a TODO in the spec
  doc, not its own issue yet).

## Acceptance criteria

- [ ] `/#/staff/crawler` renders a two-column layout: a growing, newest-at-
      the-bottom record feed on the left, pretty-printed JSON of the selected
      record on the right
- [ ] The page redirects away for non-staff/non-superuser users
- [ ] On load, the left column drains the full retained history (repeated
      `last_id`-cursor fetches starting from no cursor) then switches to
      polling every 10 seconds for new arrivals, matching the backend's
      bare-array contract
- [ ] New arrivals auto-scroll the feed to the bottom, except while the user
      has manually scrolled up to inspect older records — auto-scroll pauses
      until they scroll back to the bottom themselves
- [ ] Selecting a record in the list updates the right-column JSON view
- [ ] Specs exist for the new controllers/components following this repo's
      mirrored spec-folder convention

Owned by: `frontend`.
