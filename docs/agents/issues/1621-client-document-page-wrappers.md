# Issue: Client: document page wrappers

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and token management permissions.

Add document page support to the `documents` wrapper from #1609 (split out of #1609 by #1598). Depends on #1609 (the `documents` wrapper and the `GameResource` base).

## Problem

The client wraps `games/<slug>/documents` but not the pages nested under each document, so automations cannot read or edit a document's pages through the library.

## Expected Behavior

Document pages can be listed (paginated, with an `iterate` counterpart), created, updated, trimmed (bulk delete beyond a kept count) and version-bumped through the library, with a regular / restricted (`all.json`) variant per action; tested with a mocked `fetch`, documented, and lint passes.

## Solution

### Backend surface (from `backend/games/urls/games.py` and `docs/agents/access-control/game-document.md`)

Base path: `games/<slug>/documents/<document_id>/pages`.

| Action | Method | Regular | Restricted |
|---|---|---|---|
| list | GET (paginated) | `pages.json` | `pages/all.json` |
| create | POST | `pages.json` | `pages/all.json` |
| update | PATCH | `pages/<page_id>.json` | `pages/<page_id>/all.json` |
| trim | DELETE, body `{keep}` | `pages.json` | `pages/all.json` |
| bump version | PATCH, body `{version, exclude_ids}` | `pages/bump_version.json` | `pages/bump_version/all.json` |

There is **no** per-page `GET` and **no** per-page `DELETE` in the backend: the only delete is the bulk trim that archives and removes every page with `order > keep`.

### Client shape

- A new `DocumentPages` wrapper whose base path is `games/<slug>/documents/<id>/pages`, built from the `Documents` base path, with the variant map above (`get` absent from the map).
- Reached through `documents.pages(documentId)`, which returns a `DocumentPages` bound to that document (blank id → `UsageError`).
- Actions: `list` (+ `iterate`), `create(data)`, `update(pageId, data)` from `Resource`, plus two custom actions:
  - `trim(keep)` — `DELETE` with body `{keep}`: archives then deletes every page with `order > keep`;
  - `bumpVersion(data)` — `PATCH bump_version` with the body passed through as-is (`{version, exclude_ids}`).
- No `get` and no per-page `delete`, since the backend has neither; adding them is out of scope.
- Library only: no CLI changes (`client/src/cli/CommandRegistry.js` has no nested-resource support yet); exposing pages in the CLI would be a separate issue.
- `POST`, `PATCH` and `DELETE` are never retried (`bump_version` is not idempotent), only `GET` is.

```js
const pages = client.game('epic-quest').documents.pages(7);
await pages.list({ restricted: true });                    // GET documents/7/pages/all.json
await pages.create({ content, order: 1, version: 2 });     // POST documents/7/pages.json
await pages.update(12, { content, version: 2 });           // PATCH documents/7/pages/12.json
await pages.trim(3);                                       // DELETE documents/7/pages.json {keep: 3}
await pages.bumpVersion({ version: 2, exclude_ids: [12] }); // PATCH documents/7/pages/bump_version.json
```

### Scopes

Every call needs `documents:read` (list) or `documents:write` (create, update, trim, bump version). There is no separate delete scope. The wrapper never checks scopes: the API does (see `docs/agents/access-control/token-scopes.md`).

### Shared rules (from the removed client spec)

- Follow the shape of the existing wrappers (see `docs/agents/client/library.md#resource-wrappers`): plain parsed JSON returned, `list` returning a `Page` with an `iterate` counterpart, and a static `variants` map (action → regular / restricted path, `null` when absent).
- The caller picks a restricted variant with an explicit `{ restricted: true }`; the default is the regular one. Asking for a variant or action that does not exist throws `UsageError` locally, before any request. No automatic fallback on 403.
- Unit tests with the `specs/support/` fetch stub: URL building per variant, headers, bodies, error mapping, and that no error contains the token.

### Docs to update

- JSDoc on the new wrapper;
- `docs/agents/client/library.md` (move this family out of "Not yet wrapped" and document the methods and variants);
- `client/README.md` (usage, and the "Work in progress" note);
- `docs/guides/client.md` (the consumer guide), if user-facing usage changes.

## Benefits

Automations can maintain document pages (e.g. re-paginating content and bumping its version) with a scoped API token, through the same wrapper conventions as the rest of the client.
