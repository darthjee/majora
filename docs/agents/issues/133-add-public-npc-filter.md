# Add public NPC filter

## Context

The NPC listing endpoint `GET /games/{game_slug}/npcs.json` currently returns all NPCs for a game unconditionally. Dungeon Masters have no way to keep certain NPCs secret from players — once an NPC exists in the system it is visible to anyone who queries the endpoint. A `hidden` flag on the `Character` model would let DMs mark NPCs as not yet revealed, filtering them from the public listing while still allowing DMs to see the full roster through an authenticated endpoint.

## What needs to be done

**Backend:**
- Add `hidden = models.BooleanField(default=False)` to the `Character` model and generate the corresponding migration.
- Update the `game_npcs` view to filter `hidden=False` by default (public listing).
- Update `game_npc_detail` to return 404 when the NPC is hidden and the requester is not a DM or superuser.
- Add a new `game_npcs_all` view at `GET /games/{game_slug}/npcs/all.json` that requires DM or superuser access (401 if unauthenticated, 403 if unauthorised) and returns all NPCs including hidden ones, using the existing `CharacterEditPermission` gate pattern.
- Add `hidden` to `CharacterUpdateSerializer` so it can be set via `PATCH /games/{game_slug}/npcs/{id}.json`; the existing permission gate restricts writes to editors (DMs/superusers).

**Frontend:**
- Update both `GameNpcsController` and `GameController` to also fetch from `npcs/all.json` when an auth token is available, sending both requests simultaneously. Prefer the authenticated response when it succeeds; fall back to the public listing otherwise.

## Acceptance criteria

- [ ] `GET /games/{game_slug}/npcs.json` excludes NPCs with `hidden=True` for unauthenticated and non-DM requests.
- [ ] `GET /games/{game_slug}/npcs/all.json` returns all NPCs (including hidden ones) for authenticated DMs/superusers.
- [ ] `GET /games/{game_slug}/npcs/all.json` returns 401 for unauthenticated requests and 403 for authenticated non-DM/non-superuser requests.
- [ ] `GET /games/{game_slug}/npcs/{id}.json` returns 404 for hidden NPCs when accessed by non-DM/non-superuser users.
- [ ] `PATCH /games/{game_slug}/npcs/{id}.json` allows DMs/superusers to set the `hidden` field.
- [ ] Migration is generated for the new `hidden` field.
- [ ] Frontend NPC listing and game page NPC preview prefer the authenticated `all.json` response when a token is available.
