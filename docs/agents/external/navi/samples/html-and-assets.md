# Warm HTML pages and their CSS/JS assets

Fetch an HTML page and, in the same run, warm every stylesheet and script it
links — including bundles served from a separate CDN host.

## Scenario

`https://shop.example.com` renders server-side HTML whose `<head>` links a
hashed CSS bundle from the app itself and a JS bundle from `https://cdn.example.com`.
A cold deploy leaves both the page and those asset URLs uncached. You want one
config that warms the page, parses its HTML, and enqueues each referenced asset —
routing the CDN request through a client with its own base URL and headers.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com
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
        - selector: 'script[src]'
          attribute: src
          client: cdn
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi enqueues one job for `home_page`: `GET https://shop.example.com/`. On a
`200`, it treats the body as HTML and applies each `assets` rule to it.

The first rule matches every `<link rel="stylesheet">` and reads `href`. Say the
page contains `<link rel="stylesheet" href="/assets/app-9f2c.css">` — the
root-relative URL is concatenated with `clients.default.base_url`, and
`https://shop.example.com/assets/app-9f2c.css` is enqueued as an independent job
fetched through `default`.

The second rule matches every `<script src>` and reads `src`, using
`client: cdn`. For `<script src="//cdn.example.com/bundle-4a1b.js">`, the
protocol-relative URL is prefixed with `https:` and enqueued as
`https://cdn.example.com/bundle-4a1b.js`, fetched through the `cdn` client so it
carries the `Cache-Control: no-cache` header. An absolute `https://…` asset URL
would be used verbatim.

Each discovered asset is a normal job: expected status `200` (the `assets[].status`
default), retried on mismatch, then dead. The process exits once the page job and
every asset job have settled.

## Notes

- A resource may declare both `assets` and `actions`; they are processed
  independently after a successful response. In practice a page uses one or the
  other.
- URL-resolution table (absolute / protocol-relative / root-relative) and the
  optional `client` / `status` keys on an asset rule:
  [Warming HTML pages and their assets](../warming-html-assets.md).

---
[← Back to Samples](../samples.md)
