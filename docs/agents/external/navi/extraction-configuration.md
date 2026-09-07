# Extraction Configuration

`parser` declares how Navi pulls structured items out of a response body after a successful request — instead of (or in addition to) chaining into another resource via `actions`/`paginated_actions`. It lives under a resource entry's `parser:` key and runs independently of (in parallel with) `actions`/`paginated_actions` chaining: a resource can have only `actions`, only `parser`/`emit`, or both at once, and neither path interferes with the other.

A `parser:` block is **required** for any extraction or emission to happen. With no `parser:`, nothing is extracted and an `emit:` block on the same resource does nothing — there is no implicit or default parser.

Each item produced by `parser` is then handed to the resource's [`emit`](emit-configuration.md) block, if present, which sends it onward to an external endpoint (one request per item).

### Parser types

Three parser types are available, each producing the same shape of extracted item(s) regardless of which one is used:

- **`regex`** — applies a regular expression to the raw response body and captures a single field. Useful for pulling a value out of HTML (or any text) that isn't itself JSON.
- **`json_path`** — navigates to an array within the parsed JSON body — or, when `match` is omitted, treats the response body's own root as that array — optionally filters it, and maps selected fields into each extracted item.
- **`css`** — applies a CSS selector to an HTML response body and maps selected fields (and/or attributes) into each extracted item.

### Fields

| Field | Description |
|-------|-------------|
| `parser.type` | One of `regex`, `json_path`, `css`. Selects the extraction strategy. Required. |
| `parser.match` | Meaning depends on `type`: a regex pattern (`regex`), a dot-notation path to the array to extract items from, e.g. `data.items` (`json_path`), or a CSS selector for the repeated container elements (`css`). Required for `regex` and `css`. Optional for `json_path`: omitting `match` (the canonical form; `match: ''` and `match: '.'` are accepted aliases with identical behaviour) treats the whole parsed response body as the array of items, with no path navigation. A non-array body in that case raises the same "did not resolve to an array" error as a bad nested path. |
| `parser.filter` | Optional, `json_path`/`css` only. List of AND'ed conditions a matched item/container must satisfy to be included. `json_path`: each condition is `{ field, equals }` (literal comparison) or `{ field, equals_field }` (compares two fields of the same item; `equals_field` wins when both are given). `css`: each condition is `{ selector, attribute, trim, equals }` (literal, resolved relative to the container) or `{ ..., equals_field: { selector, attribute, trim } }` (field-to-field, both sides resolved relative to the container; `equals_field` wins when both are given). |
| `parser.fields` | Meaning depends on `type`. `json_path`: a `{ sourceKey: outputKey }` map remapping the matched item's keys into the output item. `css`: a `{ outputKey: { selector, attribute, array, trim } }` map (multi-field mode); each field is resolved relative to the matched container (an absent/empty `selector` means the container itself, `array: true` collects every match instead of just the first). |
| `parser.field` | `regex`: required, names the single output key populated with the captured value. `css`: fallback single-field mode's output key name, used when `fields` is absent. |
| `parser.attribute` | `css` fallback single-field mode only (used when `fields` is absent). Attribute to read off the matched container; reads text content when absent. |
| `parser.trim` | `css` fallback single-field mode only (used when `fields` is absent). Whether to trim the resolved value. Defaults to `true`. |

The in-memory ring buffer behind `GET /extractions.json` is sized by the top-level `extraction.size` key (a sibling of `resources`/`web`, not part of a resource's `parser` block; defaults to `100`). See [Prerequisites](prerequisites.md) for the full top-level field reference.

### The `json_path` root-array form

When the response body is itself a JSON array (e.g. `[ { "obj_type": "miniature", … }, … ]`) rather than an object with a wrapper key, omit `match` entirely — `match: ''` and `match: '.'` are accepted aliases for the same thing. The whole response body is then treated as the array of items, with no path navigation. `fields` stays required and `filter` still applies, exactly as for a nested path; a non-array body raises the same "did not resolve to an array" error as a bad nested path. `regex` and `css` still require `match`.

### Example: `json_path` extraction with `emit`

The `loot_catalog` resource below fetches a catalog, extracts every `miniature`-typed item from its `bundleObjs` array, and posts each one to the `majora_api` client:

```yaml
clients:
  lootstudios:
    base_url: https://app.lootstudios.com
  majora_api:
    base_url: https://majora.example.com

resources:
  loot_catalog:
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: bundleObjs
        filter:
          - field: obj_type
            equals: miniature
        fields:
          obj_inid: inid
          obj_title: name
          obj_post_id: post_id
          bnd_title: bundle
      emit:
        client: majora_api
        method: POST
        url: /api/miniatures
        headers:
          Authorization: Bearer $MAJORA_API_TOKEN
```

Given a response body of:

```json
{
  "bundleObjs": [
    { "obj_type": "miniature", "obj_inid": "in1", "obj_title": "Miniature One", "obj_post_id": "1001", "bnd_title": "Bundle Alpha" },
    { "obj_type": "book",      "obj_inid": "in2", "obj_title": "Book Two",      "obj_post_id": "1002", "bnd_title": "Bundle Beta" },
    { "obj_type": "miniature", "obj_inid": "in3", "obj_title": "Miniature Three","obj_post_id": "1003", "bnd_title": "Bundle Gamma" }
  ]
}
```

`filter` keeps only the two `miniature` items, and `fields` remaps each one's keys, producing:

```json
{ "inid": "in1", "name": "Miniature One",  "post_id": "1001", "bundle": "Bundle Alpha" }
{ "inid": "in3", "name": "Miniature Three", "post_id": "1003", "bundle": "Bundle Gamma" }
```

Navi then enqueues one `POST https://majora.example.com/api/miniatures` per extracted item, sending that item as the request body (unless `emit.body_template` reshapes it — see [Emit Configuration](emit-configuration.md)).

The same config works against a root-level array response (`[ { "obj_type": "miniature", … }, … ]`) by dropping `match`:

```yaml
resources:
  loot_catalog:
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        # match omitted — the whole response body is the array of items
        filter:
          - field: obj_type
            equals: miniature
        fields:
          obj_inid: inid
          obj_title: name
          obj_post_id: post_id
          bnd_title: bundle
      emit:
        client: majora_api
        method: POST
        url: /api/miniatures
```

### Example: `regex` standalone

A `parser` doesn't need `json_path`'s nested `fields`/`filter` — a `regex` parser captures a single field directly from the raw body:

```yaml
resources:
  bundle_page:
    - url: /bundle/tidal-aberrations/?logged-in
      status: 200
      client: lootstudios
      parser:
        type: regex
        match: 'postid-(\d+)'
        field: post_id
      emit:
        client: majora_api
        method: POST
        url: /api/bundles/resolve
```

Here the regex `postid-(\d+)` captures `880433` out of the response body's `postid-880433` class name, and Navi enqueues `POST https://majora.example.com/api/bundles/resolve` with `{ "post_id": "880433" }`.

**Related:** [Emit Configuration](emit-configuration.md) — sending each extracted item onward to an external endpoint.

[← Back to How to Use Navi](../how_to_use_navi.md)
