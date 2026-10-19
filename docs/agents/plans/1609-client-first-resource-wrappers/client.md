# Client Plan: Client: first resource wrappers

Main plan: [plan.md](plan.md)

## Overview

Build the resource layer under `client/src/resources/`, following
`docs/agents/specs/client/library.md` (*Module layout*, *Resource wrappers*). The layer has
generic bases (`Resource`, `GameResource`, a shared character base) and one file per scope family.
Wire them into `MajoraClient` as `client.games` and `client.game(slug)`, and document and test
them.

## Context

- The core already exists: `HttpClient` (`get` / `post` / `patch`, with paths given **without**
  `.json`), `Paginator` (`list` → `Page`, `iterate` → async generator) and `UsageError`.
- `UsageError` is raised for every bad call (a missing restricted variant, a missing slug or id)
  locally, before any request. There is no automatic fallback and no silent downgrade.
- Decision from the issue discussion: `games.list()` returns a `Page` and has `games.iterate()`,
  because `games.json` is paginated. `games.mine()` returns the plain parsed body, because
  `my-games.json` is not paginated.
- Variant map, checked against `backend/games/urls/` (paths relative to `games/<slug>/`):

  | Family | `list` | `get` | `create` | `update` |
  |---|---|---|---|---|
  | `npcs` | `npcs` / `npcs/all` | `npcs/<id>` / `npcs/<id>/full` | `POST npcs` / `POST npcs/full` | `PATCH npcs/<id>` / `PATCH npcs/<id>/full` |
  | `pcs` | `pcs` / — | `pcs/<id>` / `pcs/<id>/full` | none | `PATCH pcs/<id>` / `PATCH pcs/<id>/full` |
  | `factions` | `factions` / — | `factions/<id>` / — | `POST factions` / — | `PATCH factions/<id>` / — |
  | `items` | `items` / `items/all` | `items/<id>` / `items/<id>/full` | `POST items` / — | `PATCH items/<id>` / — |
  | `documents` | `documents` / `documents/all` | `documents/<id>` / `documents/<id>/full` | `POST documents` / — | `PATCH documents/<id>` / — |

## Steps

- [01 — Resource bases](client/01-resource-bases.md)
- [02 — Family wrappers](client/02-family-wrappers.md)
- [03 — Wire into MajoraClient](client/03-wire-majora-client.md)
- [04 — Documentation](client/04-documentation.md)

## CI Checks

- `client/`: `make client-tests` (CI job: `client_tests`)
- `client/`: `make client-lint` (CI job: `client_checks`)

## Notes

- Out of scope: document pages (#1621), link routes (#1622) and photo uploads (#1623). Keep the
  bases open for them (for example, nested sub-resources built from a parent path), but do not
  implement them.
- No `delete` on any family, and no `create` on `pcs`. Calling a missing action must not reach
  the network: either leave the method undefined or throw `UsageError`, whichever the base makes
  simpler, and test it.
- `src/index.js` stays limited to `MajoraClient` and the error classes. Resource classes are
  internal.
- URL-encode slugs and ids when building paths.
