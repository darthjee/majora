[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)

## Paginated Actions

When a resource response indicates multiple pages, use `paginated_actions` to fan out one downstream request per page. Unlike `actions` (which iterate over JSON array items), `paginated_actions` operate on the whole response and use a `pages` expression to determine how many pages to enqueue.

Each entry requires:

- **`resource`** — the resource to request for each page.
- **`pagination`** — a list of config entries:
  - **`pages`** — path expression resolved against the response (e.g. `parsedBody.pagination.pages`) that returns the total page count.
  - **`page_key`** — parameter name injected as the current page number (used as `{:page_key}` in the target URL template).
  - **`zero_indexed`** *(optional, default `false`)* — when `true`, pages run from `0` to `pages-1`; when `false`, from `1` to `pages`.

The page parameter is merged with any parameters inherited from the parent chain, so it can coexist with other `{:placeholder}` tokens in the target URL.

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
  products_page:
    - url: /products/{:page}.json
      status: 200
```

If `/categories.json` returns `{ "pagination": { "pages": 3 } }`, Navi enqueues requests for `/products/1.json`, `/products/2.json`, and `/products/3.json`.

`paginated_actions` and `actions` may coexist on the same resource — both are processed independently after a successful response.

---

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md) · Previous: [Warming HTML pages and their assets](html-assets.md) · Next: [Splitting Configuration Across Files](splitting-config.md)
