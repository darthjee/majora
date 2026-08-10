# Plan: Add miniatures source

Issue: [1053-add-miniatures-source.md](../../issues/1053-add-miniatures-source.md)

## Overview

Turn the existing, name-only, Django-admin-only `Source` model (`backend/miniatures`) into a
full standalone resource: a `url` field, a single replaceable photo (new `SourcePhoto` model),
its own list/detail/create endpoints, and a `/#/miniatures/sources` list + detail frontend page —
built as an almost exact structural mirror of the existing `stl_models` feature (model, endpoints,
pages, controllers, helpers, config, list-type, i18n), substituting `tags`/`links` for a single
`url` field and dropping everything `StlModel`-specific (tags, links, embedded sources).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Endpoints (all under `/miniatures/`, all set `X-Skip-Cache: true`)

| Method | Path | Auth | Request body | Response |
|--------|------|------|---------------|----------|
| `GET` | `/miniatures/sources.json` | `IsAuthenticated` | — (paginated, `page`/`per_page`) | `200`: array of `{id, name, photo_url}` |
| `GET` | `/miniatures/sources/<id>.json` | `IsAuthenticated` | — | `200`: `{id, name, url, photo_url}`; `404`: `{errors: {detail: ['not_found']}}` |
| `POST` | `/miniatures/sources.json` | Staff-or-superuser (`require_staff`) | `{name: string, url?: string}` | `201`: `{id, name, url, photo_url}`; `400`: `{errors: {<field>: [...]}}` (e.g. duplicate `name`); `401`/`403` |
| `POST` | `/miniatures/sources/<id>/photo_upload.json` | Staff-or-superuser (`require_staff`) | Same two-step upload-init protocol as `stl_model_photo_upload` | Same shape as `stl_model_photo_upload`'s response |

`photo_url` is `null` when the `Source` has no photo. No update/delete endpoints.

### Frontend routes

- `/miniatures/sources` (list) — key `sources`
- `/miniatures/sources/:id` (detail) — key `source`

### i18n keys the frontend consumes (translator must define, both `en`/`pt`)

- `sources_page.loading`, `sources_page.new_source`
- `source_page.loading`, `source_page.url`
- `source_new_page.title`, `.name_label`, `.url_label`, `.submit`, `.error`,
  `.photo_upload_failed`, `.retry_photo_upload`, `.skip_photo_upload`
- `header.nav_sources` (new nav link, added for parity with `header.nav_stl_models`)

Exact copy is the translator's call; the frontend plan only fixes the key names above.
