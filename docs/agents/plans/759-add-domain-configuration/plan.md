# Plan: Add domain configuration

Issue: [759-add-domain-configuration.md](../issues/759-add-domain-configuration.md)

## Overview

Add a `DomainConfiguration` model scoped to `DomainGroup` (reusing the existing `Domain` → `DomainGroup` resolution pattern already used by `games/`), exposed via a public `GET /domain/config.json` endpoint that merges domain-group-specific values over defaults (`null` → default, `""` → shown empty). The frontend consumes this at bootstrap to drive the navbar-brand title/sub-title, the browser tab title, and an optional favicon override — replacing the `header.title`/`header.subtitle` i18n keys — while a manually-uploaded, deploy-linked `domain/` static folder (mirroring the existing `photos`/`files` pattern) serves per-domain-group favicons.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)
- [infra](infra.md)
- [translator](translator.md)

## Shared contracts

**API response** — `GET /domain/config.json` (public, unauthenticated). JSON keys are `snake_case`, matching this codebase's existing API convention (e.g. `accounts/views/auth/header_status.py`'s `logged_in`/`is_superuser`/`cache_token`):

```json
{
  "favicon": null,
  "title": "Majora",
  "sub_title": "RPG"
}
```

- `favicon`: `null` (default — frontend leaves the existing static favicon/tab-icon untouched) or a string path under `/domain/...` when a domain-group override exists.
- `title` / `sub_title`: `null` → effective default (`"Majora"` / `"RPG"`), `""` → shown as empty, any other string → used as-is.
- Resolution: `request.get_host()` (port-stripped, lowercased) → `Domain` → `DomainGroup` → `DomainConfiguration`. An unrecognized host (no matching `Domain` row) gets the same full-defaults response as a recognized domain group with no `DomainConfiguration` row — never a 404.

**Favicon static path** — backend returns (and frontend reads) a `favicon` value that is always a path under the `/domain/` URL prefix. Backend doesn't need to know this path's exact shape beyond storing/returning whatever string is configured; proxy and infra must serve exactly that `/domain/` prefix as static files, backed by a deploy-time-linked `domain/` folder at the release root (same directory name used throughout: CircleCI job, proxy rule, docker-compose mount all say `domain`).

**i18n key removal** — frontend stops calling `Translator.t('header.title')` / `Translator.t('header.subtitle')`; translator removes exactly those two keys (`header.title`, `header.subtitle`) from every `frontend/assets/i18n/*/common.yaml` file. No other key is renamed or touched.
