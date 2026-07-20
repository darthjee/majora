# Infra Plan: Add game documents and character game documents

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the exact endpoint paths (produced by
backend) this config warms, and the `?per_page=5` shortlist convention already used by
`short_pc_items`/`short_npc_items`. There is **no** `/documents/{:id}.json` detail endpoint in
this issue (confirmed out of scope), so — unlike the `game_item_detail`/`pc_item_detail`/
`npc_item_detail` precedent — this plan does not add per-row detail-cache resources, only
list/paginated/shortlist ones.

## Implementation Steps

### Step 1 — Game-level document resources

In `.circleci/navi_config.yaml`, add new top-level resources mirroring `game_items`/
`paginated_game_items` (lines 144-156), substituting `items`→`documents`, but **without** a
`game_document_detail` action (no detail endpoint exists):

```yaml
  game_documents:
    - url: /games/{:slug}/documents.json
      status: 200
      paginated_actions:
        - resource: paginated_game_documents
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_game_documents:
    - url: /games/{:slug}/documents.json?page={:page}
      status: 200
```

### Step 2 — Wire into `paginated_games`

In the `paginated_games` resource's `actions` list (lines 50-71), add a `game_documents` action
alongside the existing `game_items` one:

```yaml
        - resource: game_documents
          parameters:
            slug: parsedBody.game_slug
```

### Step 3 — PC document resources

Mirror `pc_items`/`paginated_pc_items`/`short_pc_items` (lines 289-315), substituting
`items`→`documents`, again with no per-row detail resource:

```yaml
  pc_documents:
    - url: /games/{:slug}/pcs/{:id}/documents.json
      status: 200
      paginated_actions:
        - resource: paginated_pc_documents
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_pc_documents:
    - url: /games/{:slug}/pcs/{:id}/documents.json?page={:page}
      status: 200

  short_pc_documents:
    - url: /games/{:slug}/pcs/{:id}/documents.json?per_page=5
      status: 200
```

In the `pc` resource's `actions` list (around lines 244-251), add alongside `pc_items`/
`short_pc_items`:

```yaml
        - resource: pc_documents
          parameters:
            slug: parsedBody.game_slug
            id: parsedBody.id
        - resource: short_pc_documents
          parameters:
            slug: parsedBody.game_slug
            id: parsedBody.id
```

### Step 4 — NPC document resources

Same as Step 3, substituting `pc`→`npc` throughout (mirrors lines 382-408 and the `npc` resource's
actions around lines 337-341): `npc_documents`, `paginated_npc_documents`, `short_npc_documents`,
wired into the `npc` resource's `actions` list. No `npc_document_detail` either.

## Files to Change

- `.circleci/navi_config.yaml` — new `game_documents`/`paginated_game_documents`,
  `pc_documents`/`paginated_pc_documents`/`short_pc_documents`,
  `npc_documents`/`paginated_npc_documents`/`short_npc_documents` resources, plus wiring into
  `paginated_games`/`pc`/`npc`'s `actions` lists.

## CI Checks

None specific to Navi config changes beyond the existing pipeline running against the live
warmed cache — verify manually via `make dev-up` that the new endpoints return 200s and are
actually cached (check the `X-Skip-Cache`-free paths in a browser/curl before merging).

## Notes

- If a future issue adds a `/documents/{:id}.json` detail endpoint, add
  `game_document_detail`/`pc_document_detail`/`npc_document_detail` resources at that point,
  following the exact `game_item_detail`/`pc_item_detail`/`npc_item_detail` pattern (lines
  163-165, 309-311, 402-404) — deliberately left out here since the endpoint doesn't exist yet.
