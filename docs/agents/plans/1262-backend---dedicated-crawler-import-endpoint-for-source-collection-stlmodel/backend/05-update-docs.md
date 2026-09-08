# Document the new endpoint

Add a section for `POST /miniatures/stl_models/import.json` to the existing miniatures API guide,
alongside the other documented write endpoints: request fields (`name`, `external_id`, `url`,
`source_name`, `collection_name`, `collection_external_id`, `tags`, etc.), auth requirements,
upsert semantics (`external_id` first, `url` fallback for `StlModel`; global match +
source-reassignment for `Collection`), the `type: "other"` default on create, the automatic
`lootstudio` link, and the known limitation that `external_id`/`Collection.name` matching is not
namespaced per source.

## Files to Change

- `docs/guides/majora/miniatures.md` — new section documenting the endpoint, following the
  existing format used for the other miniatures endpoints in this file.
