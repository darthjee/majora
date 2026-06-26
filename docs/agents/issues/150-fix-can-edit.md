# Issue: Fix can edit

## Description
When a logged-in user who is both the DM of a game and the owner of a character accesses the character page (`/#/games/:game_slug/pcs/:id`), the request to `/games/:game_slug/pcs/:id/access.json` always returns `can_edit=false`.

**Ownership model:** a character is owned by a user through the chain `User → Player → Character` (i.e. `character.player.user == requesting_user`).
**DM model:** a user is a DM solely by having a `GameMaster` record for the game.

## Problem
The PHP proxy caches `.json` endpoint responses by default. The frontend's `BaseClient` only adds the `X-Skip-Cache: 1` request header for paths listed in `skipCacheEndpoints.js`, which contains only static auth paths. Character access endpoints have dynamic paths (e.g. `/games/slug/pcs/123/access.json`) and are never in that set, so requests are made without the skip-cache header.

The proxy therefore caches the first response to the access endpoint — often from an anonymous visitor, where the backend correctly returns `can_edit=false` — and serves that stale cached value to all subsequent requests, including authenticated DMs and character owners.

The backend (`game_pc_access` view in `source/games/views/characters.py`) already sets `X-Skip-Cache: true` on the response, which prevents new responses from being stored in the cache. However, this does not invalidate or bypass an existing stale cache entry — only a `X-Skip-Cache` header on the **request** causes the proxy to bypass the cache read.

## Expected Behavior
Requests to character access endpoints (`/games/:slug/pcs/:id/access.json` and `/games/:slug/npcs/:id/access.json`) must always bypass the proxy cache so that the response reflects the requesting user's actual permissions.

## Solution
Add `X-Skip-Cache: 1` to the request headers sent by `CharacterClient.fetchPcAccess()` and `fetchNpcAccess()` (in `frontend/assets/js/client/CharacterClient.js`). Since these paths are dynamic and cannot be added to the static `skipCacheEndpoints.js` set, the header should be passed explicitly when building the access request.

Also add a regression test covering the DM-who-is-also-the-player scenario (currently untested in `source/games/tests/views/characters_test.py`), and add a frontend spec verifying that access requests include the `X-Skip-Cache` header.
