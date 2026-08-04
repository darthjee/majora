# Documentation Summary

A 2-4 line abstract of each doc under `docs/agents/`, so an agent can decide whether to
open the full file before loading it. For a bare link-only table of contents instead, see
[index.md](index.md).

## Architecture

- **[Folder Structure](folder-structure.md)** — Top-level directory layout: what each
  top-level folder (`backend/`, `frontend/`, `proxy/`, `dockerfiles/`, `docs/`, etc.) is
  for.
- **[Architecture](architecture.md)** — Hub page splitting the architecture by concern
  (proxy, frontend, backend, shared volume, product-owner agent) to keep agent contexts
  small. Read the linked area page relevant to your task instead of loading everything.
- **[Views Organization](views-organization.md)** — Folder convention for
  `backend/games/views/` (and its mirrored test tree): plural resource folders, nested
  `game/` sub-resources, `detail/` member actions. Documented but not yet fully applied
  everywhere.
- **[Serializers Organization](serializers-organization.md)** — Folder convention for
  `backend/games/serializers/` (and its mirrored test tree): resource folders, with a
  PC/NPC sub-split only where serializer logic genuinely differs.
- **[Models Organization](models-organization.md)** — Folder convention for
  `backend/games/models/` (and its mirrored test tree): resource folders, no PC/NPC split
  since `Character` is a single model.

## Conventions

- **[Contributing](contributing.md)** — Commit guidelines (atomic, no unrelated changes,
  separate refactors) and PR standards (descriptive summary, description files when
  needed).
- **[Documentation](documentation.md)** — Markdown formatting rules for files under
  `docs/agents/` (issues, plans, hub docs): blank lines around headings and lists, enforced
  by Codacy's PR check with no local equivalent to run first.
- **[Flow](flow.md)** — Main runtime flow of the application.
- **[Product Definitions](product.md)** — Authoritative product-level concepts: entity
  definitions (split under `product/entities/`), ownership chain, GameMaster role, and
  editing rules. Consult before planning any issue that introduces new entities or changes
  access logic.

## Access & Security

- **[Access Control](access-control.md)** — Authoritative data access rules, split by
  resource under `access-control/` so an agent only needs to load the file(s) relevant to
  the resource it's working on. Update the relevant file whenever a new model or endpoint
  is introduced. Superusers always have full access, regardless of any other rule.
- **[Security Guidelines](security-guidelines.md)** — Checklist used by the `security`
  agent, split into focused pages (authentication, injection, insecure headers, exposed
  secrets, CSRF, proxy rules, input validation, mass assignment). Open only the section
  relevant to the change under review.
- **[Permissions (quick reference)](permissions.yaml)** — Docs-only YAML restating the
  role-level permission summary (admin/dm/owner/player/staff/other-users/account-data) for
  a fast skim. Not consumed by any code path — `backend/games/permissions/` remains the
  real source of truth.

## External tooling

- **[How to Use darthjee/tent](external/HOW_TO_USE_DARTHJEE-TENT.md)** — Reference hub for
  configuring the Tent reverse proxy; links to focused pages under `external/tent/` (routing
  rules, request handlers, middlewares, caching). Read in full only when changing
  `docker_volumes/proxy_configuration/` rules or debugging proxy routing/caching behavior; for
  Majora's own use of Tent as the single entry point, see [flow.md](flow.md) instead.
- **[Cache Warmer](cache-warmer.md)** — How Majora uses Navi to warm the Tent proxy cache
  after each production release; used by the `cache` agent to maintain
  `navi/navi_config.yaml`.
- **[Frontend i18n](i18n.md)** — The frontend's hand-rolled i18n layer: YAML translation
  files, the `Translator` API, language persistence, and how to add a new language.
- **[How to Use Navi](external/HOW_TO_USE_NAVI.md)** — Reference hub for Navi, the
  queue-based cache-warmer; links to focused pages under `external/navi/` (config format,
  chaining, pagination, CLI flags) so an agent loads only what it needs.

## Plans & Issues

- **[Plans](plans/)** — Implementation plans for ongoing or upcoming features, one
  directory per issue (`<issue_id>_<topic>/`).
- **[Issues](issues/)** — Detailed specs for open issues, one file per issue
  (`<issue_id>_<issue_name>.md`).
