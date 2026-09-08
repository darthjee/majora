# Add the Navi config (clients + two-pass resource)

Create `crawler/navi_config.yaml`, a single-file Navi config (no
`resources/*.yml` split needed — this crawler has exactly one resource,
unlike `navi/`'s many-resource cache-warmer). Declare two clients:
`lootstudios` (`base_url: https://app.lootstudios.com`) and `majora_api`
(base URL pointing at the Majora backend). Declare a single `resources:`
entry, `loot_catalog`, hitting `GET /wp-admin/admin-ajax.php?action=GetMyLootsCache`
on the `lootstudios` client, `status: 200`, with **two** independent
`parser`/`emit` blocks feeding off the same `bundleObjs[]` array (Navi
supports at most one `parser`/`emit` pair per resource *entry*, so this
means two separate entries under the `loot_catalog` resource list, both
targeting the same URL/client — confirm this against
`docs/agents/external/navi/extraction-configuration.md` and
`prerequisites.md`'s `resources.<name>` being a list of request entries
before finalizing; if a single entry can carry two `parser`/`emit` pairs
instead, use that simpler shape).

Bundle-side parser/emit:

```yaml
parser:
  type: json_path
  match: bundleObjs
  filter:
    - field: obj_type
      equals: bundle
  fields:
    obj_inid: external_id
    obj_title: name
    obj_slug: slug
emit:
  client: majora_api
  method: POST
  url: /miniatures/collections/import.json
  status: 200
  body_template:
    name: "{:name}"
    external_id: "{:external_id}"
    url: "https://app.lootstudios.com/bundle/{:slug}/"
    source_name: Lootstudios
```

Miniature-side parser/emit:

```yaml
parser:
  type: json_path
  match: bundleObjs
  filter:
    - field: obj_type
      equals: miniature
  fields:
    obj_inid: external_id
    obj_title: name
    bnd_inid: collection_external_id
emit:
  client: majora_api
  method: POST
  url: /miniatures/stl_models/import.json
  status: 200
  body_template:
    name: "{:name}"
    external_id: "{:external_id}"
    source_name: Lootstudios
    collection_external_id: "{:collection_external_id}"
```

Both `emit.status` values expect `200` (update) in the common re-run case;
confirm against #1281/#1262's actual create-vs-update status codes (likely
`201` on first create, `200` on update per `stl_models/import.json`'s
existing convention) — Navi's `emit.status` is a single expected value, so
pick whichever the endpoints return on a normal re-run (the primary use
case for a re-invoked crawler), and note the first-run mismatch as an
accepted rough edge in `RUNNING.md` (Step 03) rather than over-engineering
around it.

## Files to Change

- `crawler/navi_config.yaml` — new file: `clients:`, `workers:`, and the
  `loot_catalog` resource with both parser/emit passes above.
