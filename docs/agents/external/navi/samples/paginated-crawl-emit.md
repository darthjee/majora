# Crawl every page and emit every item

Combine `paginated_actions` with extraction and `emit` — fan out one request per
page, then forward every item on every page to an external sink.

## Scenario

`https://shop.example.com/items.json` returns
`{ "pagination": { "pages": 3 } }` and the paginated listing lives at
`/items.json?page={page}`, each page a JSON array of items. A downstream sink at
`https://sink.example.com/sink` accepts `POST` and answers `202`. You want Navi
to walk all three pages and emit every item it finds.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com
  sink_api:
    base_url: https://sink.example.com

resources:
  listing:
    - url: /items.json
      status: 200
      paginated_actions:
        - resource: items_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  items_page:
    - url: /items.json?page={:page}
      status: 200
      emit:
        client: sink_api
        method: POST
        url: /sink
        status: 202
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi enqueues one job for `listing`:
`GET https://shop.example.com/items.json`. On a `200`, it processes the
`paginated_actions` entry against the whole response.

`pages: parsedBody.pagination.pages` resolves to `3`, and with
`zero_indexed: false` the pages run `1..3`, so Navi enqueues three `items_page`
jobs:

- `GET https://shop.example.com/items.json?page=1`
- `GET https://shop.example.com/items.json?page=2`
- `GET https://shop.example.com/items.json?page=3`

`paginated_actions` and `emit` compose: the page fan-out happens first, then
extraction + `emit` runs *per page*. When `?page=1` returns
`[ { "id": 1 }, { "id": 2 } ]`, Navi sends `POST https://sink.example.com/sink`
with body `{ "id": 1 }` and again with `{ "id": 2 }`, each expecting `202`. The
same happens for pages 2 and 3.

Each emit is retried up to `emit.retries` (default `5`) with `emit.cooldown`
(default `5000` ms) between attempts, then tracked as failed. The process exits
once the `listing` job, all three page jobs, and every emit have settled.

## Notes

- Header keys in path expressions are always lowercase after Node.js
  normalization (e.g. `headers['x-per-page']`). Never name a `parameters` key the
  same as your `page_key`.
- Cap the fan-out from the target side with `max_page` on `items_page` — see
  [Warm a paginated API](paginated-warmup.md).
- Field references: [Paginated Actions](../paginated-actions.md) and
  [Emit Configuration](../emit-configuration.md).

---
[← Back to Samples](../samples.md)
