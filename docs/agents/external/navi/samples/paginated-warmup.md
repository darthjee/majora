# Warm a paginated API

Fan out one request per page from a page count in the response body, forward a
`per_page` value from a response header, and cap the fan-out at the first two
pages.

## Scenario

`https://shop.example.com/categories.json` returns
`{ "pagination": { "pages": 3 } }` and sets an `X-Per-Page: 25` response header.
The paginated product listing lives at `/products/{page}.json?per_page={per_page}`.
You want to warm only the first couple of listing pages — the ones a visitor is
most likely to hit — reusing the page size the server itself reported.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com

resources:
  categories:
    - url: /categories.json
      status: 200
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['x-per-page']
  products_page:
    - url: /products/{:page}.json?per_page={:per_page}
      status: 200
      max_page: 2
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi enqueues one job for `categories`:
`GET https://shop.example.com/categories.json`. On a `200`, it processes the
single `paginated_actions` entry against the whole response (no extra request).

`pages: parsedBody.pagination.pages` resolves to `3`, and
`per_page: headers['x-per-page']` resolves to `25`. Header keys in path
expressions are always lowercase after Node.js normalization — `x-per-page`, not
`X-Per-Page` — regardless of how the server cased them. Never name a `parameters`
key the same as your `page_key` (here `page`): the page number always wins and
would silently overwrite it.

With `zero_indexed: false`, pages run `1..3`, so `products_page` would fan out to
pages 1, 2, and 3. But `products_page` sets `max_page: 2`, a ceiling owned by the
target resource that applies to every caller. It counts pages, not page numbers,
so Navi enqueues only the first two:

- `GET https://shop.example.com/products/1.json?per_page=25`
- `GET https://shop.example.com/products/2.json?per_page=25`

Each is a normal job with expected status `200`, retried on mismatch then dead.
The process exits once the `categories` job and both page jobs have settled.

## Notes

- If a `parameters` path expression can't be resolved (e.g. the server omits the
  header), that one paginated action fails, enqueues no pages, is logged, and goes
  straight to dead-letter tracking with no retry. Other resources are unaffected.
- Omitting `max_page` (or setting it to `null` / `0` / a non-positive value)
  enqueues every page the caller resolves.
- Full field reference and the `zero_indexed` / `max_page` semantics:
  [Paginated Actions](../paginated-actions.md).

---
[← Back to Samples](../samples.md)
