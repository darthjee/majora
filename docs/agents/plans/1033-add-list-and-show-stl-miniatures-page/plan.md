# Plan: Add list and show STL miniatures page

Issue: [1033-add-list-and-show-stl-miniatures-page.md](../../issues/1033-add-list-and-show-stl-miniatures-page.md)

## Overview

Add a frontend-only index page (`#/stl_models`) and show page (`#/stl_models/:id`) for the
existing `stl_models` API resource, following the same index+show+pagination+picture shape
already used for other resources (closest templates: the permission-free `games` list type for
the index, and the `treasure` show page for the detail layout). Add a "STL Models" header link,
visible to any logged-in user, between "Games" and the Admin dropdown. No backend or cache-warmer
changes — the `stl_models` endpoints already exist, already require `IsAuthenticated`, and already
set `X-Skip-Cache: true` unconditionally (see the issue file's "No cache warmer changes" note).

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**Translation keys** — `frontend` will call `Translator.t(key)` for the following new keys, which
`translator` must add (with translated values) to every language file under `frontend/assets/i18n/`
(currently `en.yaml`, `pt.yaml`), keeping them in sync per `npm run check_i18n`:

| Key | Purpose | English value |
|-----|---------|----------------|
| `header.nav_stl_models` | Header nav link label | `STL Models` |
| `stl_models_page.loading` | Index page loading message | `Loading STL models...` |
| `stl_model_page.loading` | Show page loading message | `Loading STL model...` |
| `stl_model_page.links` | Show page "Links" section heading | `Links` |
| `stl_model_page.sources` | Show page "Sources" section heading | `Sources` |
| `stl_model_page.tags` | Show page "Tags" section heading | `Tags` |

`frontend` owns the exact final key names (it may add/rename a couple while implementing, e.g. if
a section ends up unnecessary) — `translator` should cross-check the actual `Translator.t(...)`
calls in the merged frontend code against this table before finalizing translations, since this
table is the plan-time best guess, not a guarantee of the final call sites.

No other cross-agent contract exists: the API endpoints, their auth requirements, and their
response shapes are pre-existing and unchanged by this issue (see the issue file), so there is no
backend/frontend contract to negotiate here.
