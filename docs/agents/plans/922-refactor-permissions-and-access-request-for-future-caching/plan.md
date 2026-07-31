# Plan: Refactor permissions and access request for future caching

Issue: [922-refactor-permissions-and-access-request-for-future-caching.md](../../issues/922-refactor-permissions-and-access-request-for-future-caching.md)

## Overview

`GET .../permissions.json` currently behaves differently depending on whether `?role=` query params are sent: with roles, it is a pure function of the query string (cacheable); without any, it falls back to resolving the real requester's identity (not cacheable). This plan makes the frontend always send an explicit role set (derived from `access.json`, which gains a new `is_logged` flag) except for a new "Not Logged" mock-preview case, and makes the backend's `permissions.json` code path always build its response from that role set, never falling back to a real-identity lookup. No actual HTTP/CDN caching is turned on by this plan — it only makes the endpoint's behavior consistent enough to cache later.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**API response** — `access.json` (`GameAccessSerializer`, `CharacterAccessSerializer`, `TreasureAccessSerializer`, all via `BaseAccessSerializer.to_representation`) gains a new field:
- `is_logged: boolean` — unlike `is_superuser`/`is_staff`/`is_dm` (which are `null` when unauthenticated), `is_logged` is never `null` — it IS the authentication signal itself.

**API request** — `permissions.json`'s `?role=` query param recognizes a new value, alongside the existing `superuser`, `dm`, `owner`, `staff`, `player`:
- `logged` — maps to `Roles.from_booleans(is_logged=...)`, which now sets the internal `logged_user` boolean from this value instead of always hardcoding `True`.
- Absence of `role=logged` in an otherwise-non-empty role set means "not logged", exactly like the absence of any other role key (default `False`) — there is no more implicit "assume logged in".
- Absence of *any* `role` param at all no longer signals "fall back to the real requester's identity" — it now means the same all-`False` (anonymous, empty) role set as a `role` param with only unrecognized values. `permissions.json` becomes a pure function of its query string in every case.

**Frontend role-name vocabulary**, shared between the two derived-role sources (a real user's `access.json` response, and the mock "view as" facade) and the backend's `?role=` parser — exactly these 6 names, mapped 1:1 from the access payload's booleans: `superuser`, `staff`, `dm`, `player`, `owner`, `logged`.

**Sequencing**: the frontend must resolve `access.json` before it can build the role set for the corresponding `permissions.json` request in the real-identity (non-mock) path — these two requests can no longer be fired in parallel for a route's first fetch.

**Explicitly out of scope / unchanged**: `Roles`'s real DB/session-based resolution (`_resolve_*` methods, and the `Roles(user=..., game=..., pc=...)` constructor path in `backend/games/permissions/roles.py`) stays exactly as-is. That path is shared with `EndpointPermission` (`backend/games/permissions/base.py`), which uses it for real authorization enforcement on edit/write endpoints elsewhere in the app — unrelated to this issue's read-only `permissions.json` preview endpoint, and explicitly out of scope per the issue ("Affecting how endpoints check permissions" is not part of this work). Only `permissions.json`'s own view/serializer code stops ever taking that branch.

## Notes

- No `CI Checks` at this index level — see each agent's file for its own commands.
- Actually turning on caching (headers already exist: `X-Force-Public-Cache`/`X-Skip-Cache`) is out of scope for this plan, per the issue.
