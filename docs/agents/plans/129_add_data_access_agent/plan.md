# Plan: Add Data Access Agent

Issue: [129_add_data_access_agent.md](../issues/129_add_data_access_agent.md)

## Overview

Create a new read-only `data-access` specialist agent that reviews diffs against a living
access-control reference document and reports violations, without applying fixes. Three
artifacts are needed: the reference doc itself (`docs/agents/access-control.md`), the agent
definition (`.claude/agents/data-access.md`), and updates to `.claude/agents/architect.md`
instructing when to invoke it.

## Context

Currently no agent systematically checks whether access-sensitive changes (new endpoints, new
serializer fields, changes to access logic) comply with the project's access-control model.
Access rules are embedded in `Character.can_be_edited_by`, `CharacterEditPermission`, and the
`game_master_detail` view but are not documented in a single authoritative place. The
`CharacterDetailSerializer` exposes `public_description` and `can_edit` to all callers;
`CharacterFullSerializer` adds `private_description` and is only served on the `*_full`
endpoints which require authentication via `CharacterEditPermission.check`.

## Implementation Steps

### Step 1 — Write `docs/agents/access-control.md`

Create a structured reference document covering:

- **User roles**: anonymous, authenticated user (Player), GameMaster (a `GameMaster` row links
  a `User` to a `Game`), superuser. Superusers always have full access. Django admin pages are
  out of scope.
- **Per-resource access table**: for each model and each endpoint, list which roles can read
  and which can write.
  - `Game` — read: all; write: superuser only (no public write endpoint)
  - `Player` — read: all (via character list); write: superuser only
  - `Character` list (`/pcs.json`, `/npcs.json`) — read: all (public fields only)
  - `Character` detail (`/pcs/<id>.json`, `/npcs/<id>.json`) — read: all
    (`public_description`, `photos`, `can_edit`); write (PATCH): player or GameMaster or
    superuser via `CharacterEditPermission`
  - `Character` full (`/pcs/<id>/full.json`, `/npcs/<id>/full.json`) — read: player or
    GameMaster or superuser (adds `private_description`); no public access
  - `Character` access status (`/pcs/<id>/access.json`, `/npcs/<id>/access.json`) — read:
    all (returns `can_edit` bool, cache-skipped)
  - `GameMaster` (`/games/<slug>/game_masters.json`) — read: all; create: any authenticated
    user (self-registration); delete: own record or superuser
  - `Photo` — read: all (via character detail); write: superuser only
  - `Link` — read: all (via game detail); write: superuser only
- **Note on new models**: when a new model is introduced, add it to this document as part of
  the same PR that introduces it.

### Step 2 — Create `.claude/agents/data-access.md`

Write a new agent definition file with:

- **Frontmatter**: `name: data-access`, `description:` (one sentence describing it as a
  read-only reviewer of data access control), `tools: Read, Bash`
- **System prompt** content:
  - Identity: read-only data access control reviewer for Majora
  - Primary reference: `docs/agents/access-control.md` — always read it first
  - Task: given a diff or a set of changed files, compare what data is exposed (fields in
    serializers, endpoints in views) and to whom (permission checks) against the access-control
    doc; report each violation precisely (file, line, rule breached)
  - Constraints: never edit files; never apply fixes; report findings to the architect who
    then delegates corrections to the appropriate specialist agent (backend, frontend, etc.)
  - Grep usage: use `Bash` only for `grep` searches to locate relevant code passages; do not
    run servers, tests, or migrations

### Step 3 — Update `.claude/agents/architect.md`

Add a new section (or extend the existing "How to coordinate" section) describing when the
data-access agent must be invoked:

- Any issue that adds a new API endpoint
- Any issue that adds or removes serializer fields on an existing endpoint
- Any issue that changes authentication, permission, or visibility logic in views or
  serializers

The pattern: after the relevant specialist agent (backend) finishes its work, dispatch
`data-access` with the list of changed files; if violations are reported, delegate fixes back
to `backend` before opening the PR.

### Step 4 — Update `AGENTS.md`

Add a row for `docs/agents/access-control.md` to the Documentation table so that all agents
know the file exists and what it contains.

## Files to Change

- `docs/agents/access-control.md` — new file; living reference for access-control rules
- `.claude/agents/data-access.md` — new agent definition
- `.claude/agents/architect.md` — add guidance on when/how to invoke `data-access`
- `AGENTS.md` — add `access-control.md` row to the Documentation table

## Notes

- All three new/updated files are pure documentation/configuration — no code change, no
  migration, no CI impact.
- The data-access agent is intentionally read-only; it must never be given `Edit` or `Write`
  tools.
- The access-control doc will grow over time as new models are added; the plan for each new
  model should include a step to update it.
