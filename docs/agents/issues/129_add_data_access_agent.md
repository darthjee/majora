# Issue: Add data access agent

## Description
Add a new read-only specialist agent responsible for verifying that data access rules are followed whenever changes touch endpoints, fields, or access logic.

## Problem
There is no agent dedicated to reviewing data access control as part of the development workflow. When other agents implement features, they may inadvertently expose data to users who should not see it (e.g., a character's `private_description` visible to non-editors) without any systematic check enforcing the access protocols.

## Expected Behavior
A new agent definition exists at `.claude/agents/data-access.md` that:
- Maintains a reference to `docs/agents/access-control.md`, which documents which user roles (superuser/admin, GameMaster, Player/user, anonymous) can access which data for every model — new models are added to this doc as they are introduced; superusers always have full access; Django admin pages are out of scope
- Is invoked by the architect agent at its discretion when an issue involves new endpoints, new serializer fields, or changes to data access logic — not on every issue automatically
- Reviews the diff/changes against the access-control doc and reports any violations back to the architect
- Is read-only: it reports findings but does not apply fixes itself; the architect delegates any required corrections to the appropriate specialist agent (backend, frontend, etc.)

## Solution
1. Create `docs/agents/access-control.md` documenting current access rules per user role for each data type (Character public/private description, GameMaster membership, Player records); note that superusers always have full access and Django admin pages are not in scope; new models are added here as they are introduced
2. Create `.claude/agents/data-access.md` with tools limited to Read and Bash (grep), and a system prompt instructing it to review changes against the access-control doc and report violations — no editing
3. Update `.claude/agents/architect.md` to instruct the architect to invoke the data-access agent when an issue involves new endpoints, new serializer fields, or changes to data access logic

## Benefits
- Access control rules are checked consistently whenever access-sensitive changes are made, not just when a developer thinks to look
- The access-control doc becomes a living reference for both agents and developers, updated alongside the models
