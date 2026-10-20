# Client Plan: Client: document page wrappers

Main plan: [plan.md](plan.md)

## Overview

Wrap `games/<slug>/documents/<document_id>/pages…` in a new `DocumentPages` resource nested
under the existing `Documents` wrapper, then cover it with specs and document it. Library only:
the CLI (`client/src/cli/CommandRegistry.js`) is not touched.

## Context

Backend surface (`backend/games/urls/games.py`, views under `backend/games/views/games/`):

| Action | Method | Regular | Restricted | Response |
|---|---|---|---|---|
| list | GET (paginated) | `pages.json` | `pages/all.json` | array + pagination headers |
| create | POST | `pages.json` | `pages/all.json` | created page |
| update | PATCH | `pages/<page_id>.json` | `pages/<page_id>/all.json` | updated page |
| trim | DELETE, body `{keep}` | `pages.json` | `pages/all.json` | `204`, no body |
| bump version | PATCH, body `{version, exclude_ids}` | `pages/bump_version.json` | `pages/bump_version/all.json` | `200`, empty body |

There is no per-page `GET` and no per-page `DELETE`. Scopes: `documents:read` for list,
`documents:write` for everything else; the wrapper never checks scopes.

Existing building blocks:

- `Resource` (`client/src/resources/Resource.js`) exposes `basePath`, `http`, `paginator`,
  `pathFor(action, { restricted, id })`, and the generic `list` / `iterate` / `create` /
  `update`. Its constructor takes `(http, paginator, basePath)`, with `basePath` already
  URL-encoded; `encodeSegment(value, label)` throws `UsageError` on a blank value.
- `HttpClient.request(method, path, { body, ... })` sends a body with any method, and
  `HttpClient.delete(path, options)` forwards options to it, so `trim` needs no new HTTP code.
- `RetryPolicy` only retries `GET`, so `POST` / `PATCH` / `DELETE` (including `bump_version`)
  are already never retried.

## Steps

- [01 — Add the DocumentPages wrapper](client/01-add-document-pages-wrapper.md)
- [02 — Specs](client/02-specs.md)
- [03 — Docs](client/03-docs.md)

## CI Checks

- `client`: `make client-tests` (CI job: `client_tests`)
- `client`: `make client-lint` (CI job: `client_checks`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- `DocumentPages` is not a `GameResource` (its base path is not `games/<slug>/<family>`); it
  extends `Resource` directly and builds its base path from the parent `Documents.basePath`.
- `trim` returns `204` with no body and `bumpVersion` returns `200` with an empty body; both
  methods return whatever `HttpClient` parses (expected `null` / empty), so document them as
  resolving with no meaningful value instead of inventing a shape.
- `specs/support/variantExamples.js` only knows `list` / `get` / `create` / `update`; either
  extend it with `trim` / `bumpVersion` (method + call shape) or test those two variants
  directly in the `DocumentPages` spec. Prefer extending the helper if it stays small.
- Out of scope: per-page `get` / `delete` (no backend endpoints) and CLI commands.
