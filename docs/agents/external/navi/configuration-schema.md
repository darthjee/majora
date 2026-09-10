# Configuration Schema

Navi is configured via a single YAML file that defines HTTP clients, resources, and the
worker pool size. This page is the full field-by-field reference for every config key.

For a CI-oriented "minimum viable config" walkthrough, see
[Prerequisites](prerequisites.md). The `parser` / `emit` crawler keys are summarized here
and covered in full in [Extraction Configuration](extraction-configuration.md) and
[Emit Configuration](emit-configuration.md).

### Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms the engine waits between allocation ticks (default: 500)
  max-retries: 3       # max number of retries before a job is marked dead (default: 3)

log:
  size: 100            # max number of log entries kept in memory (default: 100)

failure:
  threshold: 10.0      # optional: exit with failure if > 10% of jobs are dead

emit:
  size: 100            # optional: ring buffer behind GET /emissions.json (default: 100)

extraction:
  size: 100            # optional: ring buffer behind GET /extractions.json (default: 100)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)
  autostart: true       # whether the engine starts processing immediately at boot (default: true)
  idle_timeout: 900     # seconds of inactivity before auto-shutdown (default: 0, disabled)
  api:
    token: $API_TOKEN         # optional: secures the /api/* namespace (empty/omitted = disabled)
  memory:
    maximum: 2147483648        # optional: memory ceiling in bytes (default: resolved automatically)
    thresholds:                # optional: percentage-of-maximum boundaries for the reported status
      low: 25.0
      medium: 50.0
      high: 75.0
      over: 100.0

clients:
  default:
    base_url: https://example.com
    timeout: 5000            # ms before the request times out (default: 5000)
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer $API_TOKEN
      X-Custom-Header: static-value

resources:
  home:
    - url: /                   # HTML page — fetches linked JS and CSS assets
      status: 200
      assets:
        - selector: script[src]              # matches <script src="...">
          attribute: src
        - selector: link[rel="stylesheet"]   # matches <link rel="stylesheet" href="...">
          attribute: href
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information  # passes all response fields as-is
        - resource: products
          parameters:
            category_id: parsedBody.id   # extract "id" from parsed body → variable "category_id"
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages  # total page count from response
            - page_key: page                      # inject as {:page} in URL template
            - zero_indexed: false                 # pages start at 1 (default)
    - url: /categories         # redirect — Navi validates the 302 status
      status: 302
      disabled: true           # temporarily skip this entry without deleting it
    - url: /#/categories       # hash-based SPA route — same HTML template as home
      status: 200
      enabled: false           # equivalent to disabled: true
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
      actions:
        - resource: kind
          parameters:
            id: parsedBody.kind_id       # extract "kind_id" from parsed body → variable "id"
  products:
    - url: /categories/{:category_id}/products/{:page}.json
      status: 200
  products_page:
    - url: /products/{:page}.json
      status: 200
      max_page: 5      # optional: cap how many pages any caller may enqueue into this resource
  kind:
    - url: /kinds/{:id}.json
      status: 200
```

### Fields

#### `workers` / `log` / `failure`

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `workers.sleep` | Milliseconds the engine waits between allocation ticks. Defaults to `500`. |
| `workers.max-retries` | Maximum number of times a job is retried before being moved to the dead queue. Defaults to `3`. |
| `log.size` | Maximum number of log entries kept in the in-memory log buffer. Defaults to `100`. |
| `failure.threshold` | Optional. Percentage (0–100) of dead jobs that triggers a non-zero exit code. When absent, Navi always exits successfully. |

#### `web`

| Field | Description |
|-------|-------------|
| `web.port` | Port for the local monitoring web UI. Omit the `web` key entirely to run Navi without the web server. |
| `web.autostart` | Optional. Whether the engine starts processing immediately at boot. Defaults to `true`; set to `false` to boot with the web server up but the engine paused until `PATCH /engine/start` is called. |
| `web.idle_timeout` | Optional. Seconds of sustained idleness (no busy workers, no jobs in any queue) before the application auto-shuts-down, same as `PATCH /engine/shutdown`. The countdown resets whenever a job exists or a worker becomes busy. Defaults to `0` (disabled — the web server lingers indefinitely). Independent of `web.enable_shutdown`. |
| `web.api.token` | Optional. Bearer token that secures the mutating `/api/*` endpoint namespace. When empty or omitted, the `/api/*` namespace is disabled and every request to it is rejected. The unauthenticated `GET` monitoring endpoints are unaffected. |
| `web.memory.maximum` | Optional. Memory ceiling in bytes used to compute the usage percentage exposed by `GET /memory/status.json`. When omitted, resolved automatically via a fallback chain: configured value → cgroup v2 limit → cgroup v1 limit → OS total memory. |
| `web.memory.thresholds.low` / `.medium` / `.high` / `.over` | Optional. Percentage-of-maximum boundaries used to derive the reported `status` (`low`/`medium`/`high`/`over`), checked from the top down with inclusive (`>=`) boundaries. Default `{low: 25, medium: 50, high: 75, over: 100}`. Must be strictly ascending (`low < medium < high < over`) or the config is rejected at startup. |

#### `clients`

| Field | Description |
|-------|-------------|
| `clients.<name>.base_url` | Base URL for the named HTTP client. Supports environment variable references (`$VAR` or `${VAR}`), resolved at configuration load time. |
| `clients.<name>.timeout` | Optional request timeout in milliseconds. Defaults to `5000`. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. Header values support environment variable references (`$VAR` or `${VAR}`), resolved at configuration load time. |

#### `resources`

| Field | Description |
|-------|-------------|
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `disabled` / `enabled` | Optional. Set `disabled: true` (or `enabled: false`) on a resource-request entry to keep its YAML definition in place while excluding it from every enqueue path: startup, manual/API trigger by name, and as an `actions`/`paginated_actions` target. `disabled: true` always wins over any `enabled` value. Defaults to enabled. |
| `max_page` | Optional. When this request is the target of another resource's `paginated_actions`, caps how many of its pages ever get enqueued — a ceiling owned by this resource, applying uniformly to every caller. Counts pages, not page numbers (the first `max_page` pages in iteration order, whether `zero_indexed` or not). Omitted, `null`, `0`, or any other non-positive-integer value means unlimited; a present-but-invalid value also logs a warning. Defaults to unlimited. |
| `actions` | Optional list of actions to execute after a successful response. Each action names a `resource` and an optional `parameters` map. |
| `actions[].resource` | Name of the resource to act upon. Required. |
| `actions[].parameters` | Optional key-value map. Each key is the destination variable name and each value is a path expression resolved against the response wrapper (e.g. `parsedBody.id`, `headers['page']`). When absent, the parsed body item is passed through unchanged. |
| `paginated_actions` | Optional list of paginated actions to execute after a successful response. Each entry fans out one `ResourceRequestJob` per page. |
| `paginated_actions[].resource` | Name of the resource to enqueue per page. Required. |
| `paginated_actions[].pagination` | List of pagination config entries (see below). Required. |
| `paginated_actions[].pagination[].pages` | Path expression evaluated against the response (e.g. `parsedBody.pagination.pages`) that resolves to the total number of pages. |
| `paginated_actions[].pagination[].page_key` | The parameter name injected into each downstream request as the current page number. |
| `paginated_actions[].pagination[].zero_indexed` | Boolean. When `true`, page numbers start at `0`; when `false` (default), they start at `1`. |
| `paginated_actions[].parameters` | Optional key-value map, same syntax as `actions[].parameters`. Resolved against the same response used for `pages` and merged into each page's request parameters. `page_key`'s value always takes precedence on key collision. |
| `assets` | Optional list of asset extraction rules. When present on an HTML resource, Navi parses the response body and enqueues a download job for each matched URL. |
| `assets[].selector` | CSS selector used to find asset elements in the HTML response (e.g. `script[src]`, `link[rel="stylesheet"]`). |
| `assets[].attribute` | Attribute on the matched element that holds the asset URL (e.g. `src`, `href`). |
| `assets[].client` | Named client to use when fetching the asset. Defaults to `default`. |
| `assets[].status` | Expected HTTP status code for asset fetches. Defaults to `200`. |

#### `parser` / `emit` (crawler)

`parser` and `emit` turn Navi into a crawler: `parser` extracts structured items from a
response body, and `emit` sends each one onward to an external endpoint. Both live under a
resource-request entry and run in parallel with `actions`/`paginated_actions` chaining. A
`parser:` block is **required** for any extraction or emission — with no `parser`, nothing
is extracted and an `emit` block does nothing.

| Field | Description |
|-------|-------------|
| `parser` | Optional. Extracts structured items from the raw response body after a successful response, independently of (in parallel with) the resource's own `actions`/`paginated_actions` chaining. See [Extraction Configuration](extraction-configuration.md). |
| `parser.type` | One of `regex`, `json_path`, `css`. Selects the extraction strategy. Required. |
| `parser.match` | Meaning depends on `type`: a regex pattern (`regex`), a dot-notation path to the array to extract items from, e.g. `data.items` (`json_path`), or a CSS selector for the repeated container elements (`css`). Required for `regex` and `css`. Optional for `json_path`: omitting `match` (aliases `match: ''` / `match: '.'`) treats the whole parsed response body as the array of items, with no path navigation. |
| `parser.filter` | Optional, `json_path`/`css` only. List of AND'ed conditions a matched item/container must satisfy to be included (`{ field, equals }` / `{ field, equals_field }` for `json_path`; `{ selector, attribute, trim, equals }` / `{ ..., equals_field: {...} }` for `css`). |
| `parser.fields` | Field-mapping map. `json_path`: a `{ sourceKey: outputKey }` map remapping the matched item's keys. `css`: a `{ outputKey: { selector, attribute, array, trim } }` map, each field resolved relative to the matched container. |
| `parser.field` | Single output key name. `regex`: required, holds the captured value. `css`: fallback single-field mode's output key, used when `fields` is absent. |
| `parser.attribute` | `css` fallback single-field mode only (used when `fields` is absent). Attribute to read off the matched container; reads text content when absent. |
| `parser.trim` | `css` fallback single-field mode only (used when `fields` is absent). Whether to trim the resolved value. Defaults to `true`. |
| `emit` | Optional. Sends each item extracted by `parser` to an external endpoint, one request per item. Does nothing without a `parser` block. See [Emit Configuration](emit-configuration.md). |
| `emit.size` | Optional **top-level** key (a sibling of `resources`/`web`/`log`, not part of a resource's `emit` block). Sizes the in-memory ring buffer behind `GET /emissions.json`. Defaults to `100`. |
| `extraction.size` | Optional **top-level** key, sibling of `emit.size`. Sizes the in-memory ring buffer behind `GET /extractions.json`. Defaults to `100`. |

See [Extraction Configuration](extraction-configuration.md) and
[Emit Configuration](emit-configuration.md) for the full field-by-field breakdown of
`parser` and `emit`.

### Path-expression namespaces

`actions[].parameters` and `paginated_actions[].parameters` values are path expressions
resolved against the response wrapper. This is a separate mechanism from `parser` / `emit`.

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

### `GET /memory/status.json` response shape

`GET /memory/status.json` — unauthenticated, like the other `GET` monitoring endpoints (no `web.api.token` involved). Responds with:

```json
{ "current": 134217728, "maximum": 2147483648, "percentage": 6.25, "status": "low" }
```

`current`/`maximum` are byte counts (`current` is the process RSS); `percentage` is `current / maximum * 100`; `status` is one of `low`/`medium`/`high`/`over`, derived from `percentage` against `web.memory.thresholds`.

[← Back to How to Use Navi](../how_to_use_navi.md)
