# Client agent docs

Turn `docs/agents/client.md` into a hub with three new pages under `docs/agents/client/`, built
from the spec's `library.md`, `cli.md` and `packaging.md`, as implemented.

- **`docs/agents/client.md`** (hub): keep "Why it exists", "Ownership boundaries" and "Naming".
  Carry over the useful bits of the spec hub's "Scope" section (what the client is for, the
  crawler and the legacy `Token` staying unchanged, full API coverage being out of scope).
  Replace the "Lifecycle" section with a short "Pages" list linking the three pages and the
  consumer guide. Repoint the `tokens.md`/`scopes.md` links to
  `access-control/api-token.md` and `access-control/token-scopes.md` (step 02), and the
  `packaging.md` link to `client/packaging.md`.
- **`docs/agents/client/library.md`**: language and runtime (plain JS, ES modules, JSDoc, Node
  20+, native `fetch`), configuration and the `MAJORA_URL`/`MAJORA_TOKEN` fallback, HTTPS-only
  with the `localhost` and `allowInsecureHttp` opt-ins, module layout (`src/core/`,
  `src/core/errors/`, `src/resources/`, `MajoraClient.js`, `index.js`), pagination
  (`Paginator`, `Page`), the error hierarchy and how API codes map to errors, retries and
  timeouts (`RetryPolicy`), the implemented resource wrappers (games, the game-bound accessor,
  pcs, npcs, items, factions, documents), actions and regular/restricted variants, and the
  testing approach. Say that further wrappers are tracked by #1621, #1622 and #1623.
- **`docs/agents/client/cli.md`**: command grammar, output, flags, exit codes and error output,
  the executable and argument parsing, the `src/cli/` layout (`Cli`, `ArgumentParser`,
  `CommandRegistry`, `OutputWriter`, `BodyReader`, `HelpText`, `ExitCodes`), details settled by
  #1610, edge cases and security notes.
- **`docs/agents/client/packaging.md`**: package name `majora-client`, the `majora_client`
  docker-compose service, tooling, Makefile `client*` targets, the `client_tests`,
  `client_checks` and `client-release` CI jobs, the release with the app's version tags
  (`scripts/bump_version.sh client`, `scripts/release_client.sh`) and versioning. Link
  [Releasing the client](../contributing.md#releasing-the-client) instead of repeating it.
- Avoid repeating `client/README.md` (the npm-facing usage reference): the agent pages hold
  design and internals, and link the README for usage.

## Files to Change

- `docs/agents/client.md` — become the hub; drop the "Lifecycle" section and spec links.
- `docs/agents/client/library.md` — new.
- `docs/agents/client/cli.md` — new.
- `docs/agents/client/packaging.md` — new.
