# How to Use Navi

[Navi](https://github.com/darthjee/navi) is a queue-based cache-warmer written in Node.js.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

This guide is intended for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects or CI/CD pipelines.
Two integration modes are covered:

- **Option A** — use the `darthjee/navi-hey` Docker image directly in a CI step.
- **Option B** — install the `navi-hey` npm package in a Node.js-capable CI image and run it from the command line.
- **Option C** — use `darthjee/navi-hey:latest` as the CircleCI executor image (simplest for CircleCI).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option A — Docker image (`darthjee/navi-hey`)](#option-a--docker-image-darthjee-navi-hey)
- [Option B — Node.js image with `navi-hey` installed](#option-b--nodejs-image-with-navi-hey-installed)
- [Option C — CircleCI executor image](#option-c--circleci-executor-image)
- [Warming HTML pages and their assets](#warming-html-pages-and-their-assets)
- [Paginated Actions](#paginated-actions)
- [Reference](#reference)

---

## Prerequisites

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
| `actions[].resource` | Resource to enqueue after a successful response (resource chaining). |
| `actions[].parameters` | Path expressions that extract values from the response (e.g. `parsedBody.id`, `headers['x-next-page']`). |
| `paginated_actions` | Optional. Like `actions`, but fans out one request per page instead of one per array item. |
| `paginated_actions[].resource` | Resource to enqueue for each page. Required. |
| `paginated_actions[].pagination` | List of pagination config entries. Required. |
| `paginated_actions[].pagination[].pages` | Path expression resolving to the total page count (e.g. `parsedBody.pagination.pages`). |
| `paginated_actions[].pagination[].page_key` | Parameter name injected as the page number into each downstream request URL. |
| `paginated_actions[].pagination[].zero_indexed` | Boolean. Pages start at `0` when `true`, at `1` when `false` (default). |
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

---

## Option A — Docker image (`darthjee/navi-hey`)

> The `darthjee/navi-hey` image is available on [Docker Hub](https://hub.docker.com/r/darthjee/navi-hey).
> It is built from `dockerfiles/production_navi_hey/Dockerfile` and installs `navi-hey` globally via npm.

Use this option when your CI environment supports Docker.
Mount your configuration file into the container and run Navi headlessly.

### GitHub Actions

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Warm cache with Navi
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/navi_config.yml:/home/node/app/config/navi_config.yml \
            darthjee/navi-hey:latest \
            node navi.js --config config/navi_config.yml
```

### CircleCI

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/base:current
    steps:
      - checkout
      - setup_remote_docker
      - run:
          name: Warm cache with Navi
          command: |
            docker run --rm \
              -v $(pwd)/navi_config.yml:/home/node/app/config/navi_config.yml \
              darthjee/navi-hey:latest \
              node navi.js --config config/navi_config.yml
```

The container exits with a non-zero code if any request ultimately fails after all retries, which causes the CI step to fail.

---

## Option B — Node.js image with `navi-hey` installed

Use this option when your CI environment already provides a Node.js runtime and you prefer not to use Docker-in-Docker.

### Install and run with npx (no prior install needed)

```bash
npx navi-hey --config path/to/navi_config.yml
```

### Install globally and run

```bash
# npm
npm install -g navi-hey

# yarn
yarn global add navi-hey

navi-hey --config path/to/navi_config.yml
```

### GitHub Actions example

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Warm cache with Navi
        run: npx navi-hey --config navi_config.yml
```

### CircleCI example

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: npx navi-hey --config navi_config.yml
```

---

## Option C — CircleCI executor image

Use this option when running on CircleCI. Instead of using `docker run` (which requires `setup_remote_docker`) or relying on a Node.js image with `npx`, you can declare `darthjee/navi-hey:latest` directly as the job's executor image. Since `navi-hey` is installed globally in that image, you can call it as a command without any additional setup.

This is the recommended approach for CircleCI — no Docker-in-Docker, no npm install step.

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: navi-hey --config .circleci/navi_config.yaml
```

If your Navi config references environment variables in headers (e.g. `$API_TOKEN`), pass them via the CircleCI `environment` key or project environment variables:

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: navi-hey --config .circleci/navi_config.yaml
          environment:
            API_TOKEN: << pipeline.parameters.api_token >>
```

---

## Warming HTML pages and their assets

By default, Navi treats response bodies as JSON and chains further requests via `actions`.
When a resource is an HTML page (e.g. `/`, `/about`), you can instruct Navi to also warm the
CSS stylesheets and JavaScript bundles it references by declaring an `assets` list.

Each entry in `assets` specifies:

- **`selector`** — a CSS selector used to find the relevant elements in the response HTML (e.g. `link[rel="stylesheet"]`, `script[src]`).
- **`attribute`** — the attribute on each matched element that holds the asset URL (e.g. `href`, `src`).
- **`client`** *(optional)* — named client to use when fetching the asset. Defaults to `default`.
- **`status`** *(optional)* — expected HTTP status code for asset fetches. Defaults to `200`.

### Example

```yaml
clients:
  default:
    base_url: https://your-app.example.com

resources:
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
        - selector: 'script[src]'
          attribute: src
```

When Navi fetches `/`, it parses the HTML body and extracts the `href` attribute from every
`<link rel="stylesheet">` element and the `src` attribute from every `<script src="…">` element.
Each discovered URL is then fetched as an independent job that follows the standard retry/dead path.

#### URL resolution

Asset URLs are resolved to absolute form before being fetched:

| Form | Resolution |
|------|------------|
| `https://…` or `http://…` (absolute) | Used as-is. |
| `//cdn.example.com/app.css` (protocol-relative) | Prepended with `https:`. |
| `/assets/app.css` (root-relative) | Concatenated with the client's `base_url`. |

#### Using a separate CDN client

If your assets are served from a CDN with different headers or a different base URL, define a
dedicated client and reference it in the asset rule:

```yaml
clients:
  default:
    base_url: https://your-app.example.com
  cdn:
    base_url: https://cdn.example.com
    headers:
      Cache-Control: no-cache

resources:
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
          client: cdn
```

#### Combining `assets` and `actions`

A resource may declare both `assets` and `actions`. Both are processed independently after
a successful response — `assets` for HTML asset extraction and `actions` for JSON response
chaining. In practice, a resource would typically declare one or the other.

---

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

## Reference

### CLI flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config=<path>` | `-c <path>` | `config/navi_config.yml` | Path to the YAML configuration file. |

### Environment variables in client configuration

Both `base_url` and header values support environment variable substitution at load time using `$VAR` or `${VAR}` syntax:

```yaml
clients:
  default:
    base_url: ${DOMAIN_BASE_URL}
  auth_api:
    base_url: $API_BASE_URL
    headers:
      Authorization: Bearer $API_TOKEN
      X-Tenant: ${TENANT_ID}
```

If a referenced variable is not set, it is replaced with an empty string and a warning is logged. Pass the variables to the process in the usual way for your environment (e.g. `env` in Docker, `environment` in GitHub Actions / CircleCI).

### Headless vs. web UI mode

Navi can optionally serve a real-time monitoring web UI. To enable it, add a `web:` section to your configuration:

```yaml
web:
  port: 3000   # omit this section entirely to run headlessly
```

When enabled, the web UI is accessible at `http://localhost:<port>` and includes the following screens:

| Screen | URL | Description |
|--------|-----|-------------|
| Dashboard | `/#/` | Real-time job queue stats (counts per status). |
| Jobs list | `/#/jobs` | Table of all jobs across every status, with links to individual job pages. |
| Job detail | `/#/job/:id` | Full details for a specific job (ID, status, attempt count). |

For CI pipelines, omit the `web:` key so that Navi exits automatically once all jobs are processed.
