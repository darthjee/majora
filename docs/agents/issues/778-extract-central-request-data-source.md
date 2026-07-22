# Issue: Extract Central Request Data Source

## Description
Several frontend pages fetch the same or closely related resource data multiple times, with no shared coordination between components. A concrete example is character data (PC/NPC): a regular endpoint (`.../:id.json`) and a private/"full" endpoint (`.../:id/full.json`) that is only accessible with certain permissions. Today, whether to use the regular or private variant, whether a request is already in flight, and whether the data is already cached, are all decided independently by each component/controller, leading to duplicated network traffic and inconsistent behavior across pages.

This issue is about building the underlying structure for a centralized request/data layer — it introduces the classes but does not yet rewire any existing page to use them (see Solution/Implementation for details on scope).

## Problem
- More than one component may request the same data, which may or may not be cached at the proxy layer.
- Multiple similar requests are made even when the browser already holds the data, loading redundant data into browser memory.
- Parallel requests for both the regular and private/full variant of a resource are made when only one is actually needed (e.g. `GameController#fetchNpcsPreview` today fires both `/games/:game_slug/npcs.json` and `/games/:game_slug/npcs/all.json` at once and picks whichever succeeds).
- A new component added later can easily recreate an existing request instead of reusing it, since there's no shared place to check "is this already being fetched?".
- Behavior is inconsistent between initial page load and interactive filtering: e.g. on `/#/games/:game_slug/npcs`, the initial load uses `npcs/all.json` once permission is confirmed, but applying filters afterward always falls back to `npcs.json`, regardless of permission.

## Expected Behavior
A centralized request/data layer should exist so that, going forward, components can:
- Treat endpoints as resources: a resource may have one regular and one private/full URL (each with its own permission requirements), or share the same URL for both when no separate private endpoint exists.
- Get attached to an already-in-flight request instead of starting a duplicate one.
- Get already-cached data immediately when nothing relevant has changed, instead of re-fetching.
- Have stale requests aborted and replaced automatically when the query, parameters, or permission level change (e.g. a broader-access request superseding a narrower one already in flight).
- Be notified/updated automatically when the central layer reacts to login, logout, a permission check completing, or a "mock role"/facade change (mirroring how `AccessStore` already reacts to route/auth/facade changes today) — without every component wiring its own listener.

This issue only introduces the structure described below; no existing page/component is rewired to use it yet (that will be a follow-up issue/PR).

## Solution
Three cooperating classes:

### A class responsible for data
The central entry point components use to request data, given (at least):
- Resource type (`game`, `npc`, `pc`, etc.)
- Quantity type (`collection` or `single`)
- Parameters (`:game_slug`, `:character_id`, `:item_id`, etc.)
- Query (filters, etc.)
- Any other information needed (not fully defined yet)

Holds the in-memory "Request" objects (below) and delegates to them when something changes (dropping/refreshing data). This is also the class that listens for role/permission/login changes and propagates them to the relevant "Request" objects.

This is a custom, hand-rolled implementation — not built on `@tanstack/react-query` (already an installed but unused dependency) — and should build on top of the existing `AccessCache` (`utils/access/AccessCache.js`) as its underlying dedup/abort/cache primitive, the same one `AccessStore` already uses for access/permission checks, rather than reimplementing that logic independently.

### A class responsible for resource configuration
A key-based map (suggested keys: HTTP method, resource, quantity type) pointing to a configuration object that knows the resource's regular/private URLs and which permissions each requires. Can be split across multiple files for organization, then assembled into one central configuration.

The configuration does not hold roles directly — it holds the keys into the permission object (e.g. `can_edit`) that would grant access, keeping the backend as the source of truth for actual role-to-permission mapping.

### A class responsible for a Request
Represents one logical request for a resource and returns a promise consumers attach to. Given repeated calls for the same resource:
- If nothing relevant changed (permission, query, parameters, filters) and there's cached data with no ongoing request, resolves immediately with the cached data.
- If nothing changed and there's no cached data, starts a new HTTP request and returns a promise consumers can await.
- If a request for the same thing is already in flight, returns the same pending promise.
- If something relevant changed (permission, query, parameters, filters), starts a new request that will replace the current data. Consumers are notified via the data being wrapped as `{ data: <actual data> }`, so consumers read `data.<actual data>` rather than the object being replaced wholesale — this avoids notification-loop hazards that a plain event-based approach could introduce.

**Special promise**: the Request object wraps the underlying HTTP promise in its own controlled promise, so that if the underlying request is aborted/replaced, consumers already attached don't get left hanging — they resolve once the *replacement* request finishes instead.

### Minimal resource mapping (GET only)
Even though nothing consumes this yet, the following GET resource configuration should be included:
- **game** — collection: `/games.json` (everyone); single: `/games/:game_slug.json` (everyone). No separate restricted endpoint for either today, so both point at the regular configuration.
- **npc** — collection: regular `/games/:game_slug/npcs.json` (everyone) / restricted `/games/:game_slug/npcs/all.json` (admin/DM only today); single: regular `/games/:game_slug/npcs/:id.json` (everyone) / restricted `/games/:game_slug/npcs/:id/full.json` (admin/DM only today).
- **pc** — collection: `/games/:game_slug/pcs.json` (everyone); no restricted collection endpoint exists for PCs today, so it points at the regular configuration. single: regular `/games/:game_slug/pcs/:id.json` (everyone) / restricted `/games/:game_slug/pcs/:id/full.json` (the PC's owning player, that game's GM, or a superuser).
- **item** (a PC's or NPC's held `CharacterItem`s) — collection: regular `/games/:game_slug/:kind/:id/items.json` (everyone, hidden items excluded) / restricted `/games/:game_slug/:kind/:id/items/all.json` (the character's owning player or GM for PCs; GM/admin only for NPCs, plus includes hidden items); single: regular `.../items/:item_id.json` (everyone) / restricted `.../items/:item_id/full.json` (same access as the restricted collection endpoint).
- **treasure** (a PC's or NPC's held `CharacterTreasure`s) — collection: `/games/:game_slug/:kind/:id/treasures.json` (everyone); a restricted `/treasures/all.json` variant exists only for NPCs today (GM/admin only), so PCs point at the regular configuration.

Exact permission-key mapping for these should be double-checked against `docs/agents/access-control/character-item.md` and `character-treasure.md` during planning/review — see the Security note below.

The configuration object must also be shaped so that non-GET methods (POST/PATCH/DELETE) can be added later without restructuring — e.g. PC's `PATCH /games/:game_slug/pc/:id.json` (regular) vs. `PATCH /games/:game_slug/pc/:id/full.json` (private) — even though only GET is being configured in this issue.

### Security note
Even though no backend/permission logic changes, a mistake in this configuration (e.g. mapping the wrong permission key to a restricted endpoint) could cause the frontend to fetch data a user isn't authorized to see. The `security` agent should review the resource/permission configuration specifically.

## Benefits
- A single place to reason about, cache, and de-duplicate resource requests, instead of per-page ad-hoc fetch logic.
- Endpoints modeled as resources, so a resource with a regular and a private variant is configured once instead of re-decided in every component that needs it.
- Consumers requesting data that's already in flight simply attach to the existing promise, instead of firing a new request.
- When a broader-access (private/full) request for a resource arrives while a narrower (regular) request for the same resource is in flight, the narrower one can be aborted in favor of the new one, instead of running both to completion.
- Automatic reaction to login, permission checks resolving, and "mock role"/facade changes: ongoing requests can be aborted and re-issued at the new permission level once it's known, without each page wiring its own listener.
