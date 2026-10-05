# Plan: Access statistics: Visit list endpoint (visit-list.json)

Issue: [1522-access-statistics-visit-list-endpoint-visit-list-json.md](../../issues/1522-access-statistics-visit-list-endpoint-visit-list-json.md)

## Overview
Add the staff-only, paginated `GET /staff/statistics/visit-list.json` endpoint. It returns one row per visit matched by the shared statistics filters, sorted in the database by a tab-specific `sort`. Along the way, the user identity logic now private to `users.json` moves into one shared serializer. All the work is in the backend agent's scope.

See [backend.md](backend.md) for the full plan.
