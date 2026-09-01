# Reshape the emitted body with a template

Wrap each extracted item in an envelope — or pick out individual fields — with
`emit.body_template` before it is sent onward.

## Scenario

Same crawl as [Emit every extracted item](emit-extracted-items.md):
`https://shop.example.com/products.json` returns a JSON array of products. This
time the analytics endpoint at `https://analytics.example.com/events` doesn't
want the bare product — it expects an envelope with an `event` name, the whole
item under `data`, and a couple of promoted fields for indexing.

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
        body_template:
          event: item.extracted
          product_id: "{:id}"
          city: "{:address.city}"
          note: "product {:id} extracted"
          data: "{:.}"
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi crawls `/products.json` and runs `emit` once per array item, building the
body from `body_template` each time.

For the item
`{ "id": 1, "name": "Widget", "address": { "city": "Berlin" } }`, Navi sends:

```json
{
  "event": "item.extracted",
  "product_id": 1,
  "city": "Berlin",
  "note": "product 1 extracted",
  "data": { "id": 1, "name": "Widget", "address": { "city": "Berlin" } }
}
```

Token rules:

- `"{:.}"` — the whole item at its root; because the string is *exactly* one
  token, the real value is spliced in with its type preserved (an object here).
- `"{:id}"` — a single-token string, so `1` is spliced in as a number, not
  `"1"`.
- `"{:address.city}"` — a nested dot-path, resolving to `"Berlin"`.
- `"product {:id} extracted"` — the token sits inside a longer string, so the
  field value is stringified: `"product 1 extracted"`.
- A token whose path doesn't resolve on the item (e.g. `"{:sku}"` when the item
  has no `sku`) is left as the literal `{:sku}` text in the output.

`event: item.extracted` has no token, so it is sent verbatim. Everything else —
expected `emit.status` `202`, `emit.retries`, `emit.cooldown` — behaves exactly
as without a template.

## Notes

- Without `body_template`, the bare item is sent as-is.
- Full `emit.*` field reference and body-template semantics:
  [Emit Configuration](../emit-configuration.md).

---
[← Back to Samples](../samples.md)
