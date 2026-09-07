# Paginated Actions

When a resource response indicates multiple pages, use `paginated_actions` to fan out one downstream request per page. Unlike `actions` (which iterate over JSON array items), `paginated_actions` operate on the whole response and use a `pages` expression to determine how many pages to enqueue.

Each entry requires:

- **`resource`** — the resource to request for each page.
- **`pagination`** — a list of config entries:
  - **`pages`** — path expression resolved against the response (e.g. `parsedBody.pagination.pages`) that returns the total page count.
  - **`page_key`** — parameter name injected as the current page number (used as `{:page_key}` in the target URL template).
  - **`zero_indexed`** *(optional, default `false`)* — when `true`, pages run from `0` to `pages-1`; when `false`, from `1` to `pages`.
- **`parameters`** *(optional)* — a plain map (`{ key: pathExpression }`), same syntax as `actions`' `parameters`. Each value is a path expression resolved against the **same response** used to compute `pages` (no extra request). Use this to forward server-reported metadata — e.g. a `per_page` value returned in a response header — into every paginated request.

The parameters passed to each paginated request are merged in this order (later wins on a key collision):

1. Parameters inherited from the parent chain (existing behavior).
2. The resolved `parameters` map, when present — overrides same-named inherited parameters.
3. `page_key`'s page number — always wins, even over a same-named `parameters` entry. Don't name a `parameters` key the same as your `page_key` (e.g. don't extract something into a key literally called `page`) — it will be silently overwritten by the page number.

If a `parameters` path expression can't be resolved against the response (e.g. a missing header), that one paginated action fails — no pages are enqueued for it, the failure is logged, and it goes straight to the dead-letter/failed-job tracking with no retry. Other resources and other paginated actions are unaffected. This is the same error handling `actions`' `parameters` already has.

### Example

```yaml
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
```

If `/categories.json` returns `{ "pagination": { "pages": 3 } }` with a `X-Per-Page: 25` response header, Navi enqueues requests for `/products/1.json?per_page=25`, `/products/2.json?per_page=25`, and `/products/3.json?per_page=25`. Header names in path expressions are always lowercase (`headers['x-per-page']`), regardless of how the server cased them — a Node.js HTTP normalization detail.

`paginated_actions` and `actions` may coexist on the same resource — both are processed independently after a successful response.

### Capping pages with `max_page`

Sometimes you don't want to warm every page a `paginated_actions` caller reports — just the first few, most-likely-to-be-hit ones. `max_page` caps this from the **target** resource's side, independent of who calls it:

```yaml
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

Even though `/categories.json` reports 3 pages, `products_page` caps itself at 2 — Navi enqueues only `/products/1.json?per_page=25` and `/products/2.json?per_page=25`. `max_page` is a property of `products_page` itself: **every** caller that fans out into it is capped the same way, not just this one. It counts pages, not page numbers, so it composes the same way regardless of `zero_indexed` (a `zero_indexed: true` caller capped at `max_page: 2` would enqueue pages `0` and `1`, not `1` and `2`).

Omitted, `null`, `0`, or any other non-positive-integer value means unlimited (all pages the caller resolves are enqueued) — the default. A present-but-invalid value (e.g. a negative number or a non-numeric string) also logs a warning.

**Related sample:** [Warm a paginated API](samples/paginated-warmup.md), [Crawl every page and emit every item](samples/paginated-crawl-emit.md)

[← Back to How to Use Navi](../how_to_use_navi.md)
