# Prerequisites

### Navi configuration file

Both options require a YAML configuration file that tells Navi which URLs to warm.
Create a file (e.g. `navi_config.yml`) with at least a `clients` and a `resources` section.
**Omit the `web:` key** to run Navi in headless mode (no web server), which is the right choice for CI pipelines.

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms the engine waits between allocation ticks (default: 500)
  max-retries: 3       # max retries before a job is marked dead (default: 3)

log:
  size: 100            # max number of log entries kept in memory (default: 100)

failure:
  threshold: 10.0      # optional: exit with failure if > 10% of jobs are dead

clients:
  default:
    base_url: https://your-app.example.com
    timeout: 5000      # ms before the request times out (default: 5000)
  auth_api:
    base_url: https://api.your-app.example.com
    headers:
      Authorization: Bearer $API_TOKEN

resources:
  home:
    - url: /           # HTML page — fetches linked JS and CSS assets
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'   # matches <link rel="stylesheet" href="...">
          attribute: href
        - selector: 'script[src]'              # matches <script src="...">
          attribute: src
  products:
    - url: /products.json
      status: 200
      actions:
        - resource: product_detail
          parameters:
            id: parsedBody.id   # extract "id" from each response item
    - url: /products         # redirect — Navi validates the 302 status
      status: 302
      disabled: true         # temporarily skip this entry without deleting it
    - url: /#/products       # hash-based SPA route — same HTML template as home
      status: 200
  product_detail:
    - url: /products/{:id}.json
      status: 200
      client: auth_api   # use a specific named client for this request
```

Key points:

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of parallel workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `workers.sleep` | Milliseconds the engine waits between allocation ticks. Defaults to `500`. |
| `workers.max-retries` | Maximum number of times a job is retried before being moved to the dead queue. Defaults to `3`. |
| `log.size` | Maximum number of log entries kept in the in-memory log buffer. Defaults to `100`. |
| `failure.threshold` | Optional. Percentage (0–100) of dead jobs that triggers a non-zero exit code. When absent, Navi always exits successfully. |
| `clients.<name>.base_url` | Base URL prepended to every resource URL. Supports `$VAR` / `${VAR}` environment variable references. |
| `clients.<name>.timeout` | Optional request timeout in milliseconds. Defaults to `5000`. |
| `clients.<name>.headers` | Optional headers sent with every request. Values support `$VAR` / `${VAR}` environment variable references. |
| `resources.<name>` | A named group of URLs to warm. |
| `url` | URL path appended to `base_url`. Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP status code. Requests returning a different code are retried. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `enabled` | Optional. Set to `false` to mark this request disabled. Defaults to `true`. |
| `disabled` | Optional. Set to `true` to mark this request disabled — always wins over `enabled`. Defaults to `false`. A disabled request is never enqueued (not at startup, not on manual/API trigger, and not when targeted by another resource's `actions`/`paginated_actions`). |
| `max_page` | Optional. When this request is the target of another resource's `paginated_actions`, caps how many of its pages ever get enqueued — a ceiling owned by this resource, applying uniformly to every caller. Counts pages, not page numbers (the first `max_page` pages in iteration order, whether `zero_indexed` or not). Omitted, `null`, `0`, or any other non-positive-integer value means unlimited; a present-but-invalid value also logs a warning. Defaults to unlimited. |
| `actions[].resource` | Resource to enqueue after a successful response (resource chaining). |
| `actions[].parameters` | Path expressions that extract values from the response (e.g. `parsedBody.id`, `headers['x-next-page']`). |
| `paginated_actions` | Optional. Like `actions`, but fans out one request per page instead of one per array item. |
| `paginated_actions[].resource` | Resource to enqueue for each page. Required. |
| `paginated_actions[].pagination` | List of pagination config entries. Required. |
| `paginated_actions[].pagination[].pages` | Path expression resolving to the total page count (e.g. `parsedBody.pagination.pages`). |
| `paginated_actions[].pagination[].page_key` | Parameter name injected as the page number into each downstream request URL. |
| `paginated_actions[].pagination[].zero_indexed` | Boolean. Pages start at `0` when `true`, at `1` when `false` (default). |
| `paginated_actions[].parameters` | Optional. Path expressions (same syntax as `actions[].parameters`) resolved against the response and merged into each page's request parameters. `page_key`'s value always takes precedence on key collision. |
| `assets[].selector` | CSS selector used to find elements in an HTML response body. |
| `assets[].attribute` | Attribute name on matched elements that holds the asset URL (e.g. `href`, `src`). |
| `assets[].client` | Optional named client to use when fetching each discovered asset. Defaults to `default`. |
| `assets[].status` | Expected HTTP status for asset fetches. Defaults to `200`. |

> **`parsedBody` is camelCase — never `parsed_body`.**
> Path expressions in `actions[].parameters` values must use `parsedBody.<field>` (camelCase).
> Writing `parsed_body.<field>` (snake_case) is silently unrecognised and throws a
> `MissingMappingVariable` error at runtime, breaking every chained request.
>
> Valid namespaces for path expressions:
>
> | Namespace | Example | Resolves to |
> |-----------|---------|-------------|
> | `parsedBody` | `parsedBody.id` | field `id` in the parsed JSON response body |
> | `headers` | `headers['x-next-page']` | HTTP response header value |
> | `parameters` | `parameters.category_id` | parameter inherited from the parent chain |
>
> **Note:** HTTP response header names are always lowercase after Node.js normalization. Use lowercase keys in path expressions (e.g. `headers['x-total-pages']`), regardless of how the server set them.

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
