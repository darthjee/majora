# Documentation

- JSDoc on every new class and public method, with params, return and `@throws {UsageError}`, to
  keep the `eslint-plugin-jsdoc` rules green.
- `client/README.md`: add a *Resources* section under *Library usage*. Cover `client.games`
  (`list` / `iterate` / `mine` / `get`), `client.game(slug)` with its five families and their
  actions, the `{ restricted: true }` option with the variant table, the `UsageError` behavior,
  the absence of `delete` (and of `pcs.create`), and that pages, links and photos are coming in
  #1621–#1623.
- `docs/agents/specs/client/library.md`, *Actions*: add one line recording that `games.list`
  returns a `Page` (+ `iterate`) and `games.mine` returns the plain array, because
  `my-games.json` is not paginated.

## Files to Change

- `client/README.md` — new *Resources* section.
- `docs/agents/specs/client/library.md` — record the `games.mine` return shape.
