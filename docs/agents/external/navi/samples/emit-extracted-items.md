# Emit every extracted item to an external endpoint

Crawl a JSON listing and `POST` each item onward to a separate service, expecting
a `202` back.

## Scenario

`https://shop.example.com/products.json` returns a JSON array of products. A
downstream analytics service at `https://analytics.example.com` exposes
`POST /events` and answers `202 Accepted`. On each warm-up run you want Navi to
fetch the listing and forward every product it contains to that service, so the
analytics side stays in sync without a bespoke script.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com
  analytics_api:
    base_url: https://analytics.example.com

resources:
  products:
    - url: /products.json
      status: 200
      emit:
        client: analytics_api
        method: POST
        url: /events
        status: 202
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi enqueues one job for `products`:
`GET https://shop.example.com/products.json` through `default`. On a `200`, it
parses the body as JSON and runs `emit` once per extracted item.

For a body like `[ { "id": 1, "name": "Widget" }, { "id": 2, "name": "Gadget" } ]`,
Navi makes two emit requests through `analytics_api`:

- `POST https://analytics.example.com/events` with body `{ "id": 1, "name": "Widget" }`
- `POST https://analytics.example.com/events` with body `{ "id": 2, "name": "Gadget" }`

With no `body_template`, each bare item is sent unchanged. Each emit expects
`emit.status` (`202`); a mismatch or transport error is retried up to
`emit.retries` (default `5`) times with `emit.cooldown` (default `5000` ms)
between attempts, then tracked as failed. The process exits once the listing job
and both emits have settled.

## Notes

- `emit.method` must be one of `POST`, `PUT`, `PATCH`.
- To wrap or reshape the item before sending, add `emit.body_template` — see
  [Reshape the emitted body with a template](emit-body-template.md).
- Full `emit.*` field reference:
  [Emit Configuration](../emit-configuration.md).

---
[← Back to Samples](../samples.md)
