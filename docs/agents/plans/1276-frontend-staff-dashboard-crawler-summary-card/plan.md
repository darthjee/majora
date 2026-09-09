# Plan: Frontend — /#/staff/dashboard crawler summary card

Issue: [1276-frontend-staff-dashboard-crawler-summary-card.md](../../issues/1276-frontend-staff-dashboard-crawler-summary-card.md)

## Overview

Add a temporary "Crawler Debug" card to `/#/staff/dashboard` that shows
per-`type` entry counts from `GET /staff/crawler/summary.json` (name-sorted list
plus a `Total: N` row, with a distinct "No entries yet" state), and a
confirm-then-clear action that calls `DELETE /staff/crawler.json` and refreshes.
The work is entirely inside `frontend/` and follows the existing memory-cache
dashboard card triad exactly.

See [frontend.md](frontend.md) for the full plan.
