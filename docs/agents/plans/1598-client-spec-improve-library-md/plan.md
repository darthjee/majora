# Plan: Client spec: improve library.md

Issue: [1598-client-spec-improve-library-md.md](../../issues/1598-client-spec-improve-library-md.md)

## Overview

Docs-only change. Rewrite `docs/agents/specs/client/library.md` so it records every decision
settled in #1598 and has no open questions left, update the client hub for the three wrapper
sub-issues split out of #1609, and narrow #1609's GitHub body to match. No code changes.

## Context

`library.md` currently lists six open questions and speaks of "characters". The issue settles
them all (see its `## Solution`): module layout, first resource set (plain resources in #1609;
document pages #1621, link routes #1622, photo uploads #1623), the game-bound wrapper API with
an explicit `{ restricted: true }` variant option and no `delete`, the `Page` / `iterate`
pagination API, the error class hierarchy, retries (GET only) and timeouts (30 s default),
configuration validation with HTTPS-only (opt-in HTTP), and an injectable `fetch` for tests.

## Implementation Steps

### Step 1 — Rewrite `library.md`

Keep the aspect-page template (**Overview**, **Decisions**, **Open questions**, **Affected
code**, see the hub) and the opening paragraph, updating "implemented by" to name #1608, #1609,
#1621, #1622 and #1623.

- **Overview:** unchanged in substance; keep the note that `client/` is unrelated to
  `frontend/assets/js/client/`.
- **Decisions:** keep the existing *Language and runtime* subsection. Replace *Configuration*,
  *Core* and *Resource wrappers* with these subsections, moving the content from the issue's
  `## Solution` (tables, code samples, rejected alternatives included), worded as spec
  decisions rather than discussion notes:
  1. *Configuration and transport security* — `new MajoraClient({ baseUrl, token, timeout,
     retries, fetch, allowInsecureHttp })`, the env-var fallback, `baseUrl` normalization,
     `ConfigurationError` at construction, HTTPS-only with the localhost / `allowInsecureHttp`
     exceptions.
  2. *Module layout* — the tree and its rules.
  3. *Core* — Bearer auth, the JSON and `multipart/form-data` (native `FormData`/`Blob`) HTTP
     layer, `.json` URLs.
  4. *Pagination* — `Page`, `iterate`, `query`, the server default page size, the
     offset-pagination limitation.
  5. *Errors* — the API error-shape table and the hierarchy, with the "never carries the token"
     rule.
  6. *Retries and timeouts* — the two subsections as in the issue.
  7. *Resource wrappers* — the first resource set (what is in #1609, #1621, #1622, #1623, and
     what is out), the game-bound accessor, the actions (no `delete`, `update` is `PATCH`),
     plain-object return values, the `{ restricted: true }` variant map and its no-fallback /
     no-downgrade rules. Use scope family names (`npcs`, `pcs`) everywhere; no "characters".
     Keep "a wrapper does not check scopes itself, the API does".
  8. *Testing strategy* — the injectable `fetch` and the per-issue coverage list; the runner
     stays #1600's decision.
- **Open questions:** replace the list with a one-line statement that none remain (settled by
  #1598). Optionally note the hand-off to #1599 that `cli.md`'s `--game 3` example should use a
  slug.
- **Affected code:** keep the existing entries; add `docs/agents/pagination.md` and
  `docs/agents/architecture/proxy.md` (upload submit flow), and
  `docs/agents/access-control/character.md` (the regular/restricted variants).

### Step 2 — Update the hub and #1609

- `docs/agents/specs/client.md`:
  - *Sub-issues* table: add rows for #1621 (document page wrappers), #1622 (link route
    wrappers) and #1623 (photo upload wrappers), page [Library](client/library.md), agent
    `client`. Append them after the current last row and renumber nothing else; or insert them
    after #1609 and renumber the rows below — pick whichever keeps the table consistent.
  - *Order*, client track: #1621 and #1622 after #1609; #1623 after #1608 and #1609.
  - The *Library* line under *Aspect pages*: mention that #1598 settled the API surface.
- GitHub #1609 (with `gh issue edit 1609 --body-file …`): narrow it to the plain resources
  (`games` read-only via `list`/`mine`/`get`; `npcs`, `pcs`, `factions`, `items`, `documents`
  with `list`/`get`/`create`/`update`, no `delete`), the `{ restricted: true }` option, and
  point at #1621, #1622 and #1623 for the extras. Keep its unit-test and JSDoc/README items.

## Files to Change

- `docs/agents/specs/client/library.md` — full rewrite of *Decisions*, *Open questions* and
  *Affected code* as above.
- `docs/agents/specs/client.md` — sub-issue table, order and aspect-page line.
- GitHub issue #1609 body (not a repo file).

## CI Checks

- Markdown: `yarn lint_md`, run through docker-compose per `AGENTS.md` (CI job:
  `markdownlint`).

## Notes

- Specs are temporary (see `docs/agents/specs.md`); nothing goes into the permanent docs here,
  that is #1612's job.
- Do not touch `cli.md` or `packaging.md`: their open questions belong to #1599 and #1600.
- Verify each route and status code cited in the spec against `backend/games/urls/` and the
  views before writing it (for example that the first families' detail views accept only
  `GET`/`PATCH`, and that `my-games.json` is not paginated).
