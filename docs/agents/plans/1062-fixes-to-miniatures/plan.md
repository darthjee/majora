# Plan: Fixes to miniatures

Issue: [1062-fixes-to-miniatures.md](../issues/1062-fixes-to-miniatures.md)

## Overview

Four related fixes to the miniatures feature: (1) group the 3 miniatures nav links under one
header dropdown; (2) build a generic, `RequestStore`-backed resource-picker component plus a
shared cross-app `name`-search filter (extracted from two existing near-duplicate `games`
implementations); (3) let a `Collection` be created with an optional `Source` attached; (4) let a
`StlModel` be created with `Source`s and `Collection`s attached, fix tag removal in its creation
form, and expose `StlModel.collections` end-to-end (previously unexposed anywhere). No DB
migrations are needed — every relevant FK/M2M (`Collection.source`, `StlModel.sources`,
`StlModel.collections`) already exists on the models; this is entirely a serializer/view/frontend
change.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

`data-access` and `security` are read-only reviewers (no implementation steps of their own) but
should review this PR given it changes several serializer field surfaces
(`source_id`/`source_ids`/`collection_ids`, newly-exposed `StlModel.collections`) — flagging for
the implementing/reviewing agent to invoke them, not assigning them plan files here.

## Shared contracts

### Backend → Frontend: request/response shapes

- `POST /miniatures/collections.json` now accepts an optional `source_id` (integer or `null`) in
  the request body, resolving to `Collection.source`.
- `POST /miniatures/stl_models.json` now accepts optional `source_ids` (array of integers,
  default `[]`) and `collection_ids` (array of integers, default `[]`) in the request body,
  resolving to `StlModel.sources`/`StlModel.collections`.
- `GET /miniatures/sources.json` and `GET /miniatures/collections.json` now accept an optional
  `name` query param (case-insensitive substring match on `name`), alongside the existing
  `per_page`/`page`.
- `GET /miniatures/stl_models/:id.json` (`StlModelDetailSerializer`) response gains a new
  `collections` field: an array of `{name: string}` objects, mirroring the existing `sources`
  field's shape (`[{name: string}]`).
- No `resourceConfig.js` changes needed — `sourceConfig.js`/`collectionConfig.js`/
  `stlModelConfig.js` already point `GET.collection`/`POST.collection` at the right paths; the
  frontend picker consumes them as-is via `RequestStore`.

### Frontend → Translator: new i18n keys

Exact keys/namespaces the frontend agent's JSX references and the translator agent must add
(English copy — translator fills in every other locale):

- `common.yaml` → `header.nav_miniatures`: `Miniatures`
- `collection_new_page.yaml` → `source_label`: `Source`; `source_search_placeholder`: `Search sources...`
- `stl_model_new_page.yaml` → `remove_tag_tooltip`: `Remove tag`; `sources_label`: `Sources`;
  `sources_search_placeholder`: `Search sources...`; `collections_label`: `Collections`;
  `collections_search_placeholder`: `Search collections...`
- `stl_model_page.yaml` → `collections`: `Collections` (heading label, mirrors the existing
  `sources` key in the same file)
