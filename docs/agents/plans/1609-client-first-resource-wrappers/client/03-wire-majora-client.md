# Wire into MajoraClient

Expose the wrappers from the entry point.

- `client.games`: one `Games` instance built in the constructor, on the shared `HttpClient` and
  `Paginator`.
- `client.game(slug)`: returns an object with `npcs`, `pcs`, `factions`, `items` and `documents`
  bound to that slug. It throws `UsageError` for a missing or empty slug, and it builds its
  wrappers without making any request.
- Update the class JSDoc example to use `client.games.mine()` / `client.game(slug).npcs.list()`
  instead of raw `client.http.get`.

Specs: `client.games` is a `Games`, and `client.game('epic-quest').npcs.get(12)` hits
`https://majora.example.com/games/epic-quest/npcs/12.json` with the Bearer header. An empty slug
throws `UsageError`.

## Files to Change

- `client/src/MajoraClient.js` — add the `games` getter and the `game(slug)` method.
- `client/specs/MajoraClient_spec.js` — add the wiring specs.
