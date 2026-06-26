# Plan: Add a Product Owner Agent

Issue: [151-add-a-product-owner-agent.md](../issues/151-add-a-product-owner-agent.md)

## Overview

Create a product-owner agent definition and its authoritative reference document (`docs/agents/product.md`), then update `AGENTS.md` and the architecture doc to advertise the new agent and when the architect should consult it.

## Context

There is no single source of truth for product-level concepts (ownership chain, GameMaster role, editing rules). This knowledge is implicit in the ORM code and must be re-derived every time an issue touches access control or entity relationships. A dedicated read-only PO agent with a well-maintained reference doc removes this gap.

## Implementation Steps

### Step 1 — Create `docs/agents/product.md`

Write the authoritative product-definition document. It must cover at minimum:

- **Core entities** — product-level definitions of `Game`, `Player`, `User`, `Character`, and `GameMaster` (what they represent from a user perspective, not their ORM details).
- **Ownership chain** — `Character → Player → User`: the owner of a character is the Django `User` reachable via `character.player.user`. If either FK link is null the character has no owner.
- **GameMaster role** — a user with a `GameMaster` record for a game can edit any character in that game, in addition to the character's owner.
- **Editing rules** — the conditions under which a user may edit a character (must be the owner or a GameMaster of that game).

### Step 2 — Create `.claude/agents/product-owner.md`

Declare the PO agent with:
- `name: product-owner`
- `description:` read-only product definitions agent; consult when an issue introduces new entities, endpoints, or feature changes
- `tools: Read, Bash` (no write tools — this agent is read-only)
- Body: brief instructions pointing to `docs/agents/product.md` as its primary reference and listing what it can answer

### Step 3 — Update `AGENTS.md`

Add a row in the documentation table for `product.md` and mention the `product-owner` agent in the specialist-agents table, with a note on when the architect should invoke it.

### Step 4 — Update `docs/agents/architecture.md`

Add a mention of the PO agent and `docs/agents/product.md` in the documentation section.

## Files to Change

- `docs/agents/product.md` — new file; authoritative product-level reference
- `.claude/agents/product-owner.md` — new file; agent declaration
- `AGENTS.md` — add `product.md` to the docs table and list the PO agent
- `docs/agents/architecture.md` — reference the PO agent and product doc

## Notes

- The product-owner agent is read-only (Read + Bash only); it never edits files.
- No code changes are needed — this is purely documentation and agent configuration.
- No CI checks apply here (no backend or frontend files touched).
