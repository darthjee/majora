# Chain from an index to detail pages with `actions`

Fetch a JSON index, pull an ID out of every item, and fan out to a detail
resource — sending the detail calls through a token-authenticated client.

## Scenario

`https://shop.example.com/products.json` returns a JSON array of product
summaries, each with an `id`. Every product also has a detail endpoint,
`/products/{id}.json`, served by an authenticated API at
`https://api.example.com` that expects a bearer token. After a deploy you want to
warm the index plus one detail call per product, without hard-coding the ID list.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer $API_TOKEN

resources:
  products:
    - url: /products.json
      status: 200
      actions:
        - resource: product_detail
          parameters:
            id: parsedBody.id
  product_detail:
    - url: /products/{:id}.json
      status: 200
      client: auth_api
```

Run it (with `API_TOKEN` exported in the environment):

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi enqueues one job for `products`: `GET https://shop.example.com/products.json`
through `default`. On a `200`, it parses the body as JSON and processes the single
`actions` entry.

`actions` iterate over JSON array items. For a body like
`[ { "id": 10, ... }, { "id": 11, ... }, { "id": 12, ... } ]`, Navi evaluates the
`parameters` map against each item: `id: parsedBody.id` extracts `10`, `11`, `12`
in turn. `parsedBody` is camelCase — writing `parsed_body.id` is silently
unrecognised and throws `MissingMappingVariable` at runtime, breaking every
chained request.

For each extracted `id`, Navi enqueues a `product_detail` job with the `{:id}`
token substituted: `GET https://api.example.com/products/10.json`,
`/products/11.json`, `/products/12.json`. Because `product_detail` sets
`client: auth_api`, each carries `Authorization: Bearer <API_TOKEN>`.

Every job follows the normal expected-status / retry / dead path. The process
exits once the index job and all three detail jobs have settled.

## Notes

- `actions` has no dedicated feature guide — its fields, the `parsedBody` /
  `headers` / `parameters` path-expression namespaces, and the camelCase warning
  live in [Prerequisites](../prerequisites.md).
- Response-header keys in path expressions are always lowercase after Node.js
  normalization (e.g. `headers['x-next-page']`), regardless of how the server
  cased them.
- To fan out one request *per page* instead of per array item, use
  `paginated_actions` — see [Warm a paginated API](paginated-warmup.md).

---
[← Back to Samples](../samples.md)
