# Cache Plan: Add CharacterFaction

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new faction-centric endpoints from [plan.md](plan.md)'s "Shared contracts": the regular, publicly-cacheable `GET /games/{:slug}/factions/{:id}/characters.json` (paginated, no `X-Skip-Cache`). The restricted `/characters/all.json` and the `pcs/npcs/.../summary.json` endpoints are DM/admin-only and always carry `X-Skip-Cache: true` — per this agent's own read-only review mandate, those must **not** be added to the warmer config (warming restricted, per-viewer content would be actively wrong), only checked that the backend actually sets the header (see "Review" below).

## Implementation Steps

### Step 1 — Add `game_faction_characters` resource

In `navi/resources/factions.yml`, extend `game_faction_detail`'s `actions` (currently just the bare `url` + `status`, no chained actions) to walk into the new characters list, following `documents.yml`'s `game_document_details` → `game_document_files`/`game_document_photos` pattern but with the paginated shape `game_documents`/`paginated_game_documents` itself uses (since faction-characters is paginated, not a flat short-list like `short_game_document_files`):

```yaml
namespace: $NAVI_NAMEPACE
resources:
  game_factions:
    - url: /games/{:slug}/factions.json
      status: 200
      paginated_actions:
        - resource: paginated_game_factions
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_factions:
    - url: /games/{:slug}/factions.json?page={:page}&per_page={:per_page}
      status: 200
      actions:
        - resource: game_faction_detail
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_faction_detail:
    - url: /games/{:slug}/factions/{:id}.json
      status: 200
      actions:
        - resource: game_faction_characters
          parameters:
            slug: parameters.slug
            id: parameters.id

  game_faction_characters:
    - url: /games/{:slug}/factions/{:id}/characters.json
      status: 200
      paginated_actions:
        - resource: paginated_game_faction_characters
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_faction_characters:
    - url: /games/{:slug}/factions/{:id}/characters.json?page={:page}&per_page={:per_page}
      status: 200
```

(`paginated_game_faction_characters` has no further chained `actions` — each item only carries `{id, name, type, photo_path}`, and the corresponding PC/NPC detail pages are already walked from `game_pcs`/`game_npcs` elsewhere in the config, so there's nothing new to chain into per-character.)

### Step 2 — Review, read-only: `X-Skip-Cache` on the new restricted endpoints

Per this agent's read-only review mandate (never edits files, only reports): once backend's `game_faction_characters_all.py` (Step 8 of [backend.md](backend.md)) and the new `.../summary.json`/`.../summary/all.json` views land, verify the restricted ones (`characters/all.json`, `summary/all.json`) set `X-Skip-Cache: true` unconditionally, and the regular ones (`characters.json`, `summary.json`) do not set it at all — matching the issue's explicit "Special endpoints" decision. Report any violation rather than fixing it.

## Files to Change

- `navi/resources/factions.yml` — add `game_faction_characters`/`paginated_game_faction_characters`, chain from `game_faction_detail`.

## CI Checks

None specific to `navi/` in `.circleci/config.yml` beyond the `warm-up-cache`/`wake-navi` deploy-time jobs — no local test suite to run for this change; validate by inspecting the YAML shape against the existing `documents.yml`/`factions.yml` precedent.

## Notes

- Do not add `game_faction_characters_all` or the `summary`/`summary/all` endpoints to this config — they're DM/admin-restricted and always skip cache, so warming them would be both wasted work and a potential data-leak-shaped bug (caching one viewer's restricted response for all viewers).
