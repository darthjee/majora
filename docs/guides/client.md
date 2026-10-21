# Majora Client Guide

How to create a scoped API token and use it from an automation, either directly over HTTP or
with the [`majora-client`](https://www.npmjs.com/package/majora-client) Node.js package and its
`majora` CLI. For the request and response shapes of each endpoint, see the
[API guide](majora.md).

> **Rollout in progress.** Scope declarations are being added to the API family by family
> (#1630–#1639). Until an endpoint is declared, it refuses every scoped token with
> `403 {"errors": {"detail": ["token_not_allowed"]}}`, whatever scopes the token carries.

## Creating a token

Tokens are managed from a logged-in browser session only; a token can never create, list or
revoke tokens.

1. Open the account menu in the header and choose **API tokens** (`#/account/api_tokens`).
2. Click **New token** and give it a name.
3. **Choose scopes.** Tick Read and/or Write per resource family. Ticking Write also ticks
   Read, which you can untick. Pick only what the automation needs.
4. **Choose games** (optional). Leave it empty for every game you can reach, including games
   you join later, or pick specific games to restrict the token to them.
5. **Choose an expiry:** 30 days, 90 days (the default), a custom date (the token expires at
   the end of that day) or never.
6. Click **Create** and **copy the token now**. It is shown only once; Majora only keeps its
   hash. If you lose it, revoke it and create a new one.

From the same page you can rename a token and revoke it. Revoking takes effect at once:
automations using the token stop working immediately. Scopes, games and expiry cannot be
changed after creation; create a new token instead. Staff can also list and revoke any user's
tokens, and every token of a user is revoked if their account is suspended.

## What a token can do

- **Never more than you.** Every request is checked against your own roles first, then against
  the token's scopes. A token only narrows what you can already do.
- **Scopes** are `<family>:read` and `<family>:write` for 16 families: `games`, `players`,
  `pcs`, `npcs`, `documents`, `factions`, `items`, `common_items`, `possessions`, `recipes`,
  `treasures`, `sessions`, `polls`, `tasks`, `conversations` and `miniatures`. `GET` needs
  `read`; `POST`, `PUT`, `PATCH` and `DELETE` need `write`. PCs and NPCs are separate, so an NPC
  generator never needs access to the players' characters.
- Public pages (what an anonymous visitor sees) need no scope. Restricted reads need the `read`
  scope of every family in the response, and a link route needs `write` on the family it
  changes.
- **Per-game restriction:** a token restricted to some games gets
  `403 game_not_allowed` on any other game.
- **Never reachable** with a token: account, users, staff and admin routes.
- Errors: `401 token_invalid` for an unknown, revoked, expired or malformed token (no detail on
  which); `403` with `scope_missing`, `game_not_allowed` or `token_not_allowed` for a valid token
  that may not make the request.

The full rules are in [Token scopes](../agents/access-control/token-scopes.md).

## Calling the API directly

Send the token on every request:

```sh
curl -H "Authorization: Bearer mjr_..." https://majora.example.com/games/epic-quest/npcs.json
```

Bearer requests always bypass the proxy cache, so responses are never shared with other
callers. Never send a token over plain HTTP.

## Using `majora-client`

Requires Node.js 20 or later. The package has no runtime dependencies.

```sh
npm install majora-client
```

### Library

```js
import { MajoraClient, PermissionError } from 'majora-client';

const client = new MajoraClient({
  baseUrl: 'https://majora.example.com', // or MAJORA_URL
  token: process.env.MAJORA_TOKEN,       // or MAJORA_TOKEN
});

const game = client.game('epic-quest');
const page = await game.npcs.list({ perPage: 50 });
for await (const npc of game.npcs.iterate({ query: { slain: false } })) {
  console.log(npc.name);
}

try {
  await game.npcs.create({ name: 'Bob' });
} catch (error) {
  if (error instanceof PermissionError && error.code === 'scope_missing') {
    // the token lacks npcs:write
  }
}
```

Document pages are nested under their document:

```js
const pages = game.documents.pages(7);
for await (const page of pages.iterate()) { /* ... */ }    // needs documents:read
await pages.trim(3);                                        // keeps pages 1-3, needs documents:write
await pages.bumpVersion({ version: 2, exclude_ids: [12] }); // needs documents:write
```

Character links (items, documents and factions of an NPC or a PC) are nested under the
character:

```js
const items = game.npcs.items(12);
for await (const item of items.iterateAvailable()) { /* ... */ } // what NPC 12 can acquire
await items.acquire({ game_item_id: 3 });                // needs npcs:write
await items.remove({ game_item_id: 3 });                 // needs npcs:write
await game.pcs.factions(4).remove(5);                    // needs pcs:write
await game.npcs.documents(12).acquire(data, { restricted: true }); // also needs documents:read

await game.factions.characters(5);                       // the faction's members
await game.items.summary(3, 'npcs', 12);                 // item 3 as held by NPC 12
```

`acquire` and `remove` are `POST`s and are never retried; a refused link raises an `ApiError`
whose `codes` hold the API's error code.

### CLI

```sh
export MAJORA_URL=https://majora.example.com
export MAJORA_TOKEN=mjr_...      # or --token-file <path>; there is no --token flag
export MAJORA_GAME=epic-quest    # or --game <slug>

majora games mine
majora npcs list --all | jq .name
majora npcs update 12 --data '{"name": "Robert"}'
```

The CLI prints JSON only and exits with a distinct code per error class (for example `4` for a
`403`).

The full library and CLI reference (resources, restricted variants, pagination, errors,
retries, flags and exit codes) is in the
[`majora-client` README](../../client/README.md).
