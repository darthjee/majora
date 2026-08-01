# Plan: Token usage reduction

Issue: [939-token-usage-reduction.md](../issues/939-token-usage-reduction.md)

## Overview

Add three small, docs-only artifacts under `docs/agents/` so agents can orient with fewer tokens: a link-only table of contents (`index.md`), a per-doc 2-4 line abstract file (`summary.md`), and a static permission cheat-sheet (`permissions.yaml`). Nothing here changes code paths, backend permission logic, or existing docs' content — it's additive navigation/reference material, plus two pointer rows in `AGENTS.md`'s existing table. Per the discussed scope, `character.md` and `common-rules.md`/`principles.md` are explicitly **not** split in this issue.

## Context

A token-usage report (issue #939) flagged that `docs/agents/` has no lightweight index or per-doc abstract — an agent has to open `AGENTS.md`'s table (one line per doc, no real abstract) or a full doc file to know whether it's relevant. It also asked for a quick, human/agent-readable summary of the permission model (who can do what), separate from the code-level permission config under `backend/games/permissions/config/`.

## Implementation Steps

### Step 1 — `docs/agents/index.md`

Create a link-only table of contents, one line per doc, no descriptions — just fast navigation. Cover the same doc set as `AGENTS.md`'s existing "Documentation" table (Folder Structure, Architecture, Views/Serializers/Models Organization, Contributing, Flow, Product Definitions, Access Control, Security Guidelines, Cache Warmer, Frontend i18n, Mutation Migration, How to Use Navi, Plans, Issues), plus `docs/agents/summary.md` and `docs/agents/permissions.yaml` themselves. Group by rough area (Architecture / Conventions / Access & Security / External tooling / Plans & Issues) using subheadings, but keep each row to a bare link — no prose.

### Step 2 — `docs/agents/summary.md`

Create one 2-4 line abstract per doc in the same set as Step 1, geared at letting an agent decide whether to open the full file without reading it first. Base each abstract on the doc's own opening paragraph / existing "Agent Summary" callouts where present (e.g. `access-control.md`'s intro, `architecture.md`'s hub description) rather than re-deriving from scratch — keep it consistent with what the target file actually says today. Link each entry to its file.

### Step 3 — `docs/agents/permissions.yaml`

Create a static, docs-only YAML restating the role-level permission summary already agreed in the issue body — not consumed by any backend code (`config_store`/`roles.py` remain the real source of truth; this file must not create drift risk by claiming to be canonical). Structure as one entry per role using the vocabulary from [`access-control/user-roles.md`](../access-control/user-roles.md) (Anonymous, Authenticated user, GameMaster/dm, Player, Superuser/admin, Staff) plus the owner/account-data carve-outs, e.g.:

```yaml
# Docs-only quick reference. Not consumed by any code path — the
# real source of truth is backend/games/permissions/config/ and
# backend/games/permissions/roles.py. See docs/agents/access-control/
# for the authoritative, per-endpoint rules.
admin:
  access: everything
dm:
  access: everything inside a game they are DM of
owner:
  access: everything inside a PC they own
player:
  access: regular mutation endpoints inside the game they are a player of
staff:
  access: >-
    regular mutation endpoints in any game (as if a player), plus staff
    endpoints
other_users:
  access: none, except mutations on their own account
account_data:
  access: restricted to the user, unless dm or staff
```

Add a one-line disclaimer (as in the comment above) that this is a docs-only simplification and the code config is canonical, so it can't be mistaken for a machine-readable manifest.

### Step 4 — Wire into `AGENTS.md`

Add two rows to `AGENTS.md`'s existing "Documentation" table: one for `docs/agents/index.md` (described as the entry point to fetch first) and one for `docs/agents/summary.md`. Do not otherwise restructure or shrink the existing table — that was explicitly out of scope for this issue.

## Files to Change

- `docs/agents/index.md` — new, link-only TOC.
- `docs/agents/summary.md` — new, per-doc 2-4 line abstracts.
- `docs/agents/permissions.yaml` — new, static role-permission cheat sheet with a docs-only disclaimer.
- `AGENTS.md` — add two rows to the Documentation table pointing at the two new files.

## Notes

- No CI job lints or builds `docs/agents/`; this is a pure documentation change with no CI Checks section needed.
- Keep `permissions.yaml` intentionally small (the 7 rules from the issue body) — do not attempt to enumerate every endpoint; that's what `access-control/` is for.
- If `index.md`/`summary.md` grow unwieldy later, `summary.md` can be split into a `docs/agents/summary/` folder per the issue's note — not needed at this size.
