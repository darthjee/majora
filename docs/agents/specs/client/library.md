# Library

The Node.js library in the new top-level `client/` folder: the core that automations import, and
the first resource wrappers built on it. Part of the [client spec](../client.md) (epic #1592).
Refined by #1598 and implemented by #1608 (core) and #1609 (resource wrappers).

## Overview

Automations import the library to call the Majora API with a scoped token (see
[Tokens](tokens.md)). It has a generic core (configuration, HTTP, authentication, pagination,
errors) and a first set of resource wrappers. The [CLI](cli.md) is a thin layer on top.

The top-level `client/` is **unrelated** to `frontend/assets/js/client/`, which holds the SPA's
own API clients. They share no code and no owner.

## Decisions

### Language and runtime

- Plain JavaScript with ES modules and JSDoc types. No build step, no TypeScript compilation.
- Native `fetch`, so it needs Node 20 or later. No HTTP dependency.

### Configuration

- The entry point is `new MajoraClient({ baseUrl, token })`.
- When an option is omitted, the library falls back to the `MAJORA_URL` and `MAJORA_TOKEN`
  environment variables.

### Core

- **Auth.** Every request carries `Authorization: Bearer <token>`.
- **HTTP.** A shared HTTP layer builds `.json` URLs, sends JSON bodies and parses JSON
  responses.
- **Pagination.** The HTTP layer understands the API's pagination (see
  [`pagination.md`](../../pagination.md)), so wrappers can fetch one page or iterate over all of
  them.
- **Errors.** Non-success responses become typed errors that carry the status code and the
  response body.

### Resource wrappers

- The core is generic. Resource wrappers sit on top of it, one per resource family.
- This epic delivers only a first set of wrappers; full API coverage is out of scope. Game
  content (characters, factions, documents, items) is the likely first set.
- A wrapper only works within its token's scopes (see [Scopes](scopes.md)); it does not check
  scopes itself, the API does.

## Open questions

Settled by #1598:

- Which resources come first (likely game content: characters, factions, documents, items).
- The actions each wrapper exposes (list, get, create, update, delete) and their signatures.
- The pagination API exposed to callers (async iterator, page objects, or both).
- The error class hierarchy (for example a base error plus authentication, permission, not
  found and validation errors).
- Whether requests support retries or timeouts.
- The module layout inside `client/`.

## Affected code

- `client/`: new top-level folder, owned by the `client` agent (added by #1601).
- [`pagination.md`](../../pagination.md): the API pagination contract the core follows.
- `crawler/` (see [`crawler.md`](../../crawler.md)): an existing Node.js client using the
  legacy token. Unchanged; useful only as a reference.
- `frontend/assets/js/client/`: unrelated, despite the name.
