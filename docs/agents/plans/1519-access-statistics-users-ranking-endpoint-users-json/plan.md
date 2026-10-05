# Plan: Access statistics: Users ranking endpoint (users.json)

Issue: [1519-access-statistics-users-ranking-endpoint-users-json.md](../../issues/1519-access-statistics-users-ranking-endpoint-users-json.md)

## Overview
Add `GET /staff/statistics/users.json`, the staff-only backend of the access statistics Users tab.
It returns a paginated plain array of per-user visit metrics plus each user's identity, sorted by
the `sort` param. All of the work is in `backend/`, plus one access-control doc row.

See [backend.md](backend.md) for the full plan.
