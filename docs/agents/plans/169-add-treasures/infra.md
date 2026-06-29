# Infra Plan: Add Treasures

Main plan: [plan.md](plan.md)

## Shared contracts

The backend agent adds these endpoints, which must be included in the Navi cache-warmer config:

| Method | URL | Notes |
|--------|-----|-------|
| `GET` | `/treasures.json` | Paginated list — triggers detail fetches |
| `GET` | `/treasures/<id>.json` | Treasure detail |

The access endpoint (`/treasures/<id>/access.json`) carries `X-Skip-Cache: true` and must **not** be added to the Navi config (it is intentionally cache-bypassed).

## Implementation Steps

### Step 1 — Add treasure resources to `.circleci/navi_config.yaml`

Add the following resources under the `resources:` key in `.circleci/navi_config.yaml`, following the same pattern used for `games`/`paginated_games`/`pc`:

```yaml
  treasures:
    - url: /treasures.json
      status: 200
      paginated_actions:
        - resource: paginated_treasures
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_treasures:
    - url: /treasures.json?page={:page}
      status: 200
      actions:
        - resource: treasure_detail
          parameters:
            id: parsedBody.id

  treasure_detail:
    - url: /treasures/{:id}.json
      status: 200
```

Also add the `treasures` resource as an entry point. Check whether `.circleci/navi_config.yaml` has a top-level `entry_points:` or `start:` key; if so, add `treasures` there. If the config uses the first resource listed under `resources:` as the entry point (like `games`), add `treasures` as a peer entry alongside it.

### Step 2 — Verify the config is valid YAML

```
docker-compose run --rm majora_django python -c "import yaml; yaml.safe_load(open('.circleci/navi_config.yaml'))"
```

Or simply inspect the file manually for correct indentation.

## Files to Change

- `.circleci/navi_config.yaml` — add `treasures`, `paginated_treasures`, and `treasure_detail` resources

## Notes

- The access endpoint `/treasures/<id>/access.json` sends `X-Skip-Cache: true` — do not include it in Navi.
- The `POST` and `PATCH` endpoints require authentication and cannot be warmed by Navi.
- Navi processes `paginated_actions` by iterating over all pages and triggering detail fetches for each item returned.
