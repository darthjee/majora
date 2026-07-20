# Infra Plan: PC show page should show up to 11 photos

Main plan: [plan.md](plan.md)

## Shared contracts

Must warm the exact URL the frontend's preview fetch will request once its default `per_page`
becomes `11`: `/games/{:slug}/pcs/{:id}/photos.json?per_page=11` (and the `npcs` equivalent).

## Implementation Steps

### Step 1 — Add `short_pc_photos`/`short_npc_photos` resources

`.circleci/navi_config.yaml` currently has no photo-preview-specific warm entry — `pc_photos`
(line 249) / `npc_photos` (line 334) warm the full paginated list at the default page size (24),
unrelated to the 6-photo (soon 11-photo) preview. Treasures and items already have this pattern
via `short_pc_treasures`/`short_pc_items` (`?per_page=5`, lines 277-278 and 305-306) and their
NPC equivalents (`short_npc_treasures`/`short_npc_items`, lines 362-363 and 390-391). Add the
photo equivalents at `per_page=11`, following the same shape:

```yaml
  short_pc_photos:
    - url: /games/{:slug}/pcs/{:id}/photos.json?per_page=11
      status: 200
```

Place it directly after the `pc_photos`/`paginated_pc_photos` block (after line 261, before
`pc_treasures` at line 263), mirroring where `short_pc_treasures` sits relative to
`pc_treasures`/`paginated_pc_treasures`.

```yaml
  short_npc_photos:
    - url: /games/{:slug}/npcs/{:id}/photos.json?per_page=11
      status: 200
```

Place it directly after the `npc_photos`/`paginated_npc_photos` block, mirroring
`short_npc_treasures`'s placement relative to `npc_treasures`/`paginated_npc_treasures`.

### Step 2 — Wire the new resources into the `pc`/`npc` action lists

In the `pc` resource's `actions` list (`.circleci/navi_config.yaml:224-247`), add a
`short_pc_photos` action alongside the existing `pc_photos` action, using the same
`parsedBody.game_slug`/`parsedBody.id` parameters:

```yaml
        - resource: short_pc_photos
          parameters:
            slug: parsedBody.game_slug
            id: parsedBody.id
```

Do the same for the `npc` resource's `actions` list (lines 309-332), adding a
`short_npc_photos` action next to the existing `npc_photos` action.

## Files to Change

- `.circleci/navi_config.yaml` — add `short_pc_photos`/`short_npc_photos` resources at
  `per_page=11`, and wire them into the `pc`/`npc` action lists.

## CI Checks

- repo root: `navi-hey --config .circleci/navi_config.yaml` (CI job using the
  `darthjee/navi-hey` image, `.circleci/config.yml:427-432`) — validates the config is
  well-formed.

## Notes

- Keep `per_page=11` in lock-step with the frontend's `MAX_PREVIEW_PHOTOS`/`CharacterClient`
  default — see [plan.md](plan.md)'s "Shared contracts". If the frontend value ever changes
  again, these two warm-cache entries need to change with it.
