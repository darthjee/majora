# Infra Plan: Character photo gallery

Main plan: [plan.md](plan.md)

## Shared contracts

The endpoints being added to the warm-up chain
(`/games/{:slug}/pcs/{:id}/photos.json` and `/games/{:slug}/npcs/{:id}/photos.json`) already
exist and are unaffected by this issue's frontend/translator work — this is purely wiring a
pre-existing route into Navi's cache warmer, following the same pagination shape already used
for `game_treasures`/`paginated_game_treasures`.

## Implementation Steps

### Step 1 — Add paginated photo resources

In `.circleci/navi_config.yaml`, add two new resources, mirroring the existing
`game_treasures`/`paginated_game_treasures` pair (lines 127-139) but scoped per-character:

```yaml
  pc_photos:
    - url: /games/{:slug}/pcs/{:id}/photos.json
      status: 200
      paginated_actions:
        - resource: paginated_pc_photos
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_pc_photos:
    - url: /games/{:slug}/pcs/{:id}/photos.json?page={:page}
      status: 200

  npc_photos:
    - url: /games/{:slug}/npcs/{:id}/photos.json
      status: 200
      paginated_actions:
        - resource: paginated_npc_photos
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_npc_photos:
    - url: /games/{:slug}/npcs/{:id}/photos.json?page={:page}
      status: 200
```

### Step 2 — Wire the new resources off the existing `pc`/`npc` resources

Update the existing `pc` and `npc` resources (lines 164-170) to trigger the new resources as
actions, passing through the `slug`/`id` parameters already available at that point (same
pattern as `game_detail`'s actions at lines 70-79):

```yaml
  pc:
    - url: /games/{:slug}/pcs/{:id}.json
      status: 200
      actions:
        - resource: pc_photos
          parameters:
            slug: parsedBody.game_slug
            id: parsedBody.id

  npc:
    - url: /games/{:slug}/npcs/{:id}.json
      status: 200
      actions:
        - resource: npc_photos
          parameters:
            slug: parsedBody.game_slug
            id: parsedBody.id
```

## Files to Change

- `.circleci/navi_config.yaml` — add `pc_photos`/`paginated_pc_photos` and
  `npc_photos`/`paginated_npc_photos` resources; wire them as actions off the existing `pc` and
  `npc` resources.

## Notes

- No CI job change is needed — the existing `warm-up-cache` job already runs
  `navi-hey --config .circleci/navi_config.yaml` against the full file
  (`.circleci/config.yml`); this only adds resources to that same file.
- Double-check `parsedBody.id`/`parsedBody.game_slug` are the correct field names returned by
  the `pc`/`npc` detail endpoints (matching `CharacterDetailSerializer`'s `id`/`game_slug`
  fields) before merging — the plan assumes they match the existing sibling resources' usage of
  the same field names.
