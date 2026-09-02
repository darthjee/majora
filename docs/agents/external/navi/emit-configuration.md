# Emit Configuration

`emit` declares a follow-up HTTP call made with data collected while crawling a resource — instead of (or in addition to) chaining into another resource via `actions`/`paginated_actions`, each item extracted from a response can be sent onward to an external endpoint. It lives under a resource entry's `emit:` key.

### Fields

| Field | Description |
|-------|-------------|
| `emit.client` | The client to use for this emit request. Either a bare client name (shorthand, resolved in the resource's own namespace, falling back to `default`), or an object with an explicit target `namespace` — same shape as a resource's top-level `client` (see [Splitting Configuration Across Files](splitting-configuration.md)). Defaults to the `default` client when omitted. |
| `emit.method` | The HTTP method used for the emit request. Must be one of `POST`, `PUT`, `PATCH`. Required. |
| `emit.url` | The URL to emit the request to. Supports `{:placeholder}` tokens resolved from the parameters inherited by the item's chain. Required. |
| `emit.status` | The expected status code of the emit response. |
| `emit.retries` | The maximum number of retries for this emit, overriding the built-in default of `5`. Must be a non-negative number when given. |
| `emit.cooldown` | The cooldown, in milliseconds, applied between emit retries, overriding the built-in default of `5000`. Must be a non-negative number when given. |
| `emit.headers` | A map of extra HTTP headers to send with this emit request, merged over the client's own headers. Values must be strings, numbers, or booleans. Defaults to no extra headers when omitted. |

### Body Template

By default, `emit` sends the bare extracted item as the request body, unchanged. `emit.body_template` lets you reshape or wrap that item into a different JSON shape before it's sent — useful for wrapping the item in an envelope, renaming fields, or dropping fields the endpoint doesn't need.

`body_template` is a plain object or array — the desired JSON body shape — with `{:...}` tokens embedded in its string leaf values:

- **`{:key}`** — resolves to the value of `key` on the extracted item.
- **`{:nested.path}`** — resolves to a nested field, following the dot-path (e.g. `{:address.city}`).
- **`{:.}`** — the special path referring to the whole item (its root). This is what makes wrapping the entire item straightforward.

A template string value that is *exactly* one token (nothing else in the string) splices in the real value at that path, preserving its type — object, array, number, boolean, string, or `null`. A token embedded inside a longer string (e.g. `"note {:id} extracted"`) is replaced by the field's value stringified instead. A token whose path doesn't resolve on the item is left as the literal `{:...}` text in the output.

### Example

```yaml
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
          data: "{:.}"
```

For an extracted item `{ "id": 1, "name": "Widget" }`, Navi sends:

```json
{
  "event": "item.extracted",
  "data": { "id": 1, "name": "Widget" }
}
```

If `emit` had no `body_template`, the bare item (`{ "id": 1, "name": "Widget" }`) would be sent as-is.

**Related sample:** [Emit every extracted item to an external endpoint](samples/emit-extracted-items.md), [Reshape the emitted body with a template](samples/emit-body-template.md)

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
