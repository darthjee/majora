# Plan: Add memory cache

Issue: [704-add-memmory-cache.md](../issues/704-add-memmory-cache.md)

## Overview

Add a project-wide, in-process (in-memory) cache module under `backend/majora_project/cache/`
— independent of any single Django app, since there's no Redis available in this environment.
The module is a size-bounded, LRU-evicting key/value store partitioned by "type" then "key",
with a shared base class and one subclass per data type. As its first consumer, four existing
permission checks (admin-or-staff, Game DM/player, PC DM/owner, NPC DM) read/write through it
instead of always hitting the database. A new staff-only `/#/staff/dashboard` frontend page adds
a single "Clear Cache" button wired to a new `DELETE staff/cache.json` endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### New endpoint (backend produces, frontend consumes)

| Method | URL | Auth |
|---|---|---|
| DELETE | `/staff/cache.json` | Staff-or-superuser only (`require_staff`, same as other `staff/*` endpoints) |

- Success: `200 OK` (or `204 No Content`), empty/trivial JSON body — the frontend only cares
  about the response status, not the body shape.
- Sets `X-Skip-Cache: true`, matching every other `staff/*` endpoint.
- Errors: `401` (unauthenticated) / `403` (authenticated but not staff/superuser), same shape as
  the existing `require_staff` helper already produces elsewhere.

### New settings (backend owns, referenced by the issue)

- `MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES` (int, default `10485760` — 10 MB): total cache size limit.
- `MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE` (int, default `10`): number of least-recently-read
  entries evicted per save once the limit is reached.

### Frontend route (frontend owns)

- `#/staff/dashboard` → page key `staffDashboard`, gated the same way as `staffUsers`
  (`{ kind: 'staffOrSuperuser' }` in `accessRouteConfig.js`).
