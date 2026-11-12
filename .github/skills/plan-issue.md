---
name: plan issue
description: Create an issue brief and a role-based implementation plan for a Majora issue on a dedicated issue branch.
parameters:
  - name: issue_id
    type: integer
    description: GitHub issue number to review and plan.
---

# Plan issue

Create a complete planning package for a Majora issue in a dedicated branch.

## Goal

For the given issue id, generate the working documentation needed to move from discussion into implementation without guessing at scope or ownership.

## Inputs

- GitHub issue number: `<issue_id>`
- Issue body and comments from the repository
- Relevant prior Copilot chat discussion when available
- Current repo instructions: `AGENTS.md` and `docs/agents/`

## Required workflow

1. Read the issue, its comments, and the project guidance in `AGENTS.md` and relevant docs under `docs/agents/`.
2. If relevant prior Copilot chat context is missing, ask the user to provide it before continuing.
3. Ask clarifying questions if the issue is ambiguous or missing required constraints.
4. Create or switch to branch `issue-<id>`. If it does not exist, create it from `main`.
5. Build the issue doc at:
   `docs/agents/issues/<id>-<slug>.md`
   where `<slug>` is the issue title lowercased and spaces are replaced with `-`.
6. Build the implementation plan at:
   `docs/agents/plans/<id>-<slug>/`
   keeping one file per major agent responsibility, for example `architect.md`, `backend.md`, or `frontend.md`.
7. When useful, add a hub file named `agent.md` that points to the role-specific plan files and summarizes the plan structure.
8. Delegate each agent plan to the responsible agent and keep the architect as the coordinator.
9. Commit the generated documentation to the issue branch.

## Expected output structure

```text
docs/
  agents/
    issues/
      1759_add-copilot-skill-for-planning-issue-implementation.md
    plans/
      1759_add-copilot-skill-for-planning-issue-implementation/
        agent.md
        architect.md
        backend.md
```

## Required behavior

- Prefer the issue title and repository docs as the authority for naming and scope.
- Use the issue ID as the canonical identifier for branch, doc paths, and plan directory names.
- Keep the plan split by agent responsibility instead of mixing all work into one file.
- Use clear technical sections: summary, scope, dependencies, execution steps, risks, and verification.
- Keep documentation in English.
- Commit only the documentation changes produced by the planning process.

## Decision rules

- If the issue is already being worked on in a branch, reuse it.
- If missing context prevents a safe plan, stop and ask the user for it instead of inventing assumptions.
- If the issue spans multiple roles, create separate per-role plan files and keep the architect file as the coordinator.

## Final result

The skill must leave the repository on a dedicated `issue-<id>` branch with the generated issue brief and role-based plan files already committed.
