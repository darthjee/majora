# Add hidden treasure

## Context

Currently, all treasures added to a game are visible to any player browsing `/games/:game_slug/treasures.json` (the game's treasure catalog). DMs/admins have no way to add treasure to a game that stays out of that public catalog while still being awardable to specific characters — for example, a rare artifact meant to be handed out secretly rather than browsed and bought openly.

- `Treasure` (`source/games/models/treasure.py`) has no visibility flag; every treasure linked or exclusive to a game shows up in the game's public catalog.
- `game_treasures` (`source/games/views/games/game_treasures.py`) and `TreasureCreateSerializer`/`TreasureUpdateSerializer` have no way to mark a treasure hidden at creation or later.
- There's no DM/admin-only endpoint that returns the full catalog including hidden treasures, unlike the existing `games/:game_slug/npcs/all.json` (`source/games/views/characters/game_npcs_all.py`) precedent for hidden NPCs (`Character.hidden`).
- The planned "acquire treasure" listing (#312, not yet built — no acquire/sell modal exists in the frontend today) will need a way to browse hidden treasures too when the requester is a DM/admin.

## What needs to be done

Backend:

- Add a migration for `Treasure.hidden` (`BooleanField(default=False)`).
- Add `hidden` to `TreasureCreateSerializer.Meta.fields` and `TreasureUpdateSerializer.Meta.fields` (not required, defaults to `False` on create), settable on both create and update, for both game-exclusive and global treasure creation, since these share the same serializers.
- Filter `game_treasures`'s GET queryset (`GET /games/:game_slug/treasures.json`) to exclude `hidden=True`, same as today's public game-treasure catalog behavior.
- Add a `game_treasures_all` view + `GET /games/:game_slug/treasures/all.json` URL, mirroring `game_npcs_all`: `GameEditPermission.check(request, game)` (only a GameMaster of the game or a superuser may call it — anyone else gets the existing 401/403 from that check), unfiltered queryset (`Q(linked_game=game) | Q(game=game)`), `TreasureListSerializer`, same pagination as `treasures.json`, with `X-Skip-Cache: true` set on the response (stricter than `npcs/all.json`, which relies on cache invalidation instead — this endpoint follows the no-cache approach since it can expose hidden content).
- A character's own treasure list (`GET .../pcs/:id/treasures.json` / `.../npcs/:id/treasures.json`, `CharacterTreasureSerializer`) is unaffected: it already lists `CharacterTreasure` rows regardless of the linked `Treasure.hidden` value, so a character keeps seeing treasure it already owns even if that treasure is later hidden from the catalog.
- No change needed to `game_pc_treasures`/`game_npc_treasures`/`CharacterTreasureSerializer` or to the top-level `/treasures.json` (global catalog) endpoint — out of scope, since the issue only calls out the game-scoped catalog.

Frontend:

- Out of scope for this issue. Frontend wiring is deferred until #312's acquire modal exists; when it lands, it should follow the existing dual-fetch pattern used for NPCs (`CharacterClient.fetchNpcsAll` / `GameNpcsController.js`, and the `X-Skip-Cache`-suffix config in `frontend/assets/js/config/skipCacheEndpoints.js`/`skipCacheSuffixes.js`) rather than inventing a new one. When #312's acquire-tab listing is eventually implemented, it should call `treasures/all.json` instead of `treasures.json` whenever the requester is a GameMaster of the game or a superuser, so DMs/admins can award/sell hidden treasure to a character; regular players continue to see only the non-hidden catalog via `treasures.json`.

## Acceptance criteria

- [ ] `Treasure` has a `hidden` boolean field, default `false`, added via migration.
- [ ] `hidden` is settable on create (`TreasureCreateSerializer`) and update (`TreasureUpdateSerializer`).
- [ ] `GET /games/:game_slug/treasures.json` excludes treasures where `hidden=true`.
- [ ] A new endpoint `GET /games/:game_slug/treasures/all.json` returns every treasure linked/exclusive to the game (hidden and visible), paginated the same way as `treasures.json`.
- [ ] `treasures/all.json` is restricted to a GameMaster of the game or a superuser via `GameEditPermission.check`; other callers get the existing 401/403.
- [ ] `treasures/all.json` responses set `X-Skip-Cache: true`.
- [ ] Character-owned treasure listings (`pcs/:id/treasures.json`, `npcs/:id/treasures.json`) remain unaffected by `hidden`.
- [ ] Existing tests updated and new tests added for the `hidden` field, the filtered `treasures.json` behavior, and the new `treasures/all.json` endpoint (including permission checks).

Tags: :shipit:
