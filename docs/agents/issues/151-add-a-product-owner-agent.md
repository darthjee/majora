# Issue: Add a Product Owner Agent

## Description
Add a Product Owner (PO) agent responsible for documenting and maintaining product-level concepts and definitions. The PO does not own any code, but keeps an authoritative product-definition document under `docs/agents/` that other agents can consult for domain knowledge. When new endpoints or features are discussed, the architect consults the PO agent to ensure product concepts are correctly applied.

## Problem
There is no single source of truth for product-level concepts. For example, knowing that the *owner of a character* is determined by the chain `character.player.user` (the Django `User` connected to the `Player` connected to the `Character`) is implicit in the code but never formally documented. Specialist agents must re-read model source to reason about ownership, roles, and access — and edge cases like nullable links go undocumented.

## Expected Behavior
A `docs/agents/product.md` file (which may be split for organization as the doc grows) exists as the authoritative reference for product definitions. It covers at minimum:

- **Ownership chain**: `Character → Player → User` — the owner of a character is the Django `User` reachable via `character.player.user`; if either FK link is null the character has no owner
- **GameMaster role**: a user with a `GameMaster` record for a game can edit any character in that game, alongside the character's owner
- **Core entities**: what a `Game`, `Player`, `User`, `Character`, and `GameMaster` each represent at the product level (distinct from their ORM definitions)
- **Editing rules**: the conditions under which a user may edit a character

A PO agent is declared in `.claude/agents/product-owner.md` (read-only, tools: Read and Bash) pointing to `docs/agents/product.md` as its primary reference. The architect invokes the PO agent when discussing issues that introduce new endpoints or features, before planning implementation.

## Solution
- Create `docs/agents/product.md` (start as a single file; split into sub-files under `docs/agents/product/` as it grows) containing all product-level concepts listed above
- Declare `.claude/agents/product-owner.md` as a read-only agent whose reference document is `docs/agents/product.md`
- Update `AGENTS.md` and the architecture doc to list the PO agent, its reference file, and when the architect should consult it

## Benefits
- Single source of truth for product concepts; specialist agents and the architect no longer need to re-derive ownership rules from model code
- Edge cases (nullable ownership chain) are explicitly documented, reducing inconsistency across implementations
- Architect consults PO during issue discussion, ensuring new features align with product definitions from the start
