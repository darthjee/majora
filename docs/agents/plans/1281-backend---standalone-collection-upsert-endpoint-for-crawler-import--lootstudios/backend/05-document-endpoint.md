# Document the endpoint

Add a `### POST /miniatures/collections/import.json` entry to `docs/guides/majora/miniatures.md`, following `### POST /miniatures/stl_models/import.json`'s (line 238) exact format (prose paragraph explaining the upsert-by-`external_id`-then-`name` keying and how it differs from the plain create endpoint, fenced request-body JSON with inline per-field comments, bullet list of behaviors, `Response` paragraph). Placement: after `### GET /miniatures/collections/<id>.json` (line 56-70) and before `### POST /miniatures/collections/<id>/photo_upload.json` (line 72) — mirroring where `stl_models/import.json` sits relative to STL Models' CRUD/photo-upload endpoints.

Suggested content:

```markdown
### `POST /miniatures/collections/import.json`

Crawler-import upsert of a single Collection, keyed by a source-provided
`external_id` (falling back to `name`) rather than by numeric `id` — separate
from the plain `POST /miniatures/collections.json` create endpoint, and the
counterpart to `POST /miniatures/stl_models/import.json` for the case where a
bundle has no currently-owned miniatures to emit (so no `Collection` would
otherwise be created as a side effect of a `StlModel` import). The crawler
calls this endpoint once per bundle; there is no array/batch variant. Auth:
staff/admin only. Request body:

\`\`\`json
{
  "name": "string (required)",
  "external_id": "string | null (optional, unique)",
  "url": "string | null (optional, http/https only, NOT unique-validated here)",
  "source_name": "string (required)"
}
\`\`\`

- `source_name` get-or-creates a `Source` by `name` and (re)assigns it onto the
  `Collection`, even overwriting a different prior value or `null` — same
  behavior as `stl_models/import.json`'s `source_name` handling.
- The `Collection` is looked up by `external_id` first, then by `name`.
  - Found: `name`/`url` (whichever were sent) are updated, and `source` is
    (re)assigned — this is how a `Collection` stub created via
    `stl_models/import.json`'s `collection_external_id` (with no `name`) gets
    filled in with its real `name`/`url` by a later call here, order-independent
    since both endpoints upsert by the same `external_id`.
  - Not found: a new `Collection` is created.

Response `201` (new item) or `200` (existing item updated/filled in): full
Collection detail, same shape as the `GET` endpoint above. Response `400` on
validation failure (e.g. missing `name`/`source_name`), same shape as
stl_models/sources.
```

(The `\`\`\`` above are literal triple-backtick fences in the actual doc — escaped here only because this plan step itself is inside a fenced code block.)

## Files to Change

- `docs/guides/majora/miniatures.md` — add the `POST /miniatures/collections/import.json` section between the collection detail (`GET .../<id>.json`) and photo-upload entries.
