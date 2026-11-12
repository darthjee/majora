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
5. Create the issue brief at `docs/agents/issues/<id>-<slug>.md`, where `<slug>` is the issue title lowercased with spaces replaced by hyphens.
6. Create the plan directory at `docs/agents/plans/<id>-<slug>/`.
7. Write the required plan hub to `docs/agents/plans/<id>-<slug>/plan.md`. The architect must read this file first. It summarizes the overall plan, links every role-specific plan, and explains how the architect coordinates and delegates execution to the responsible agents.
8. Create one role-specific plan per major agent responsibility at `docs/agents/plans/<id>-<slug>/<agent>.md` (for example, `architect.md`, `backend.md`, or `frontend.md`). The responsible agent writes and owns its plan; the architect coordinates the work rather than authoring every role's plan. If a role's plan needs multiple documents, place them under `docs/agents/plans/<id>-<slug>/<agent>/` and link them from that agent's `<agent>.md` plan and from `plan.md` as appropriate.
9. Commit only the documentation changes produced by the planning process to the issue branch.

## Expected output structure

```text
docs/
  agents/
    issues/
      1759-add-copilot-skill-for-planning-issue-implementation.md
    plans/
      1759-add-copilot-skill-for-planning-issue-implementation/
        plan.md
        architect.md
        backend.md
        frontend/
          api-contract.md
          migration.md
```

The role names and nested plan files above are examples; include only roles and supporting documents needed by the issue. `plan.md` is always required, even when the architect is the only responsible agent. The issue brief is a separate file under `issues/`, not part of the plan directory.

## Required behavior

- Prefer the issue title and repository docs as the authority for naming and scope.
- Use the issue ID as the canonical identifier for the branch and both documentation paths.
- Keep the issue brief at `docs/agents/issues/<id>-<slug>.md` and the implementation plan under `docs/agents/plans/<id>-<slug>/`; do not place plan files in the issue brief location.
- Treat `plan.md` as the canonical hub and the architect's first read, not as an optional file. It must link all role plans and explain ownership, sequencing, and delegation.
- Keep the plan split by agent responsibility instead of mixing all work into one file. Each responsible agent authors and owns its plan; the architect coordinates them.
- A role plan may be split into multiple files under `docs/agents/plans/<id>-<slug>/<agent>/`. Keep the `<agent>.md` entry point alongside `plan.md` and link any nested documents clearly.
- Use clear technical sections: summary, scope, dependencies, execution steps, risks, and verification.
- Keep documentation in English.
- Commit only the documentation changes produced by the planning process.

## Decision rules

- If the issue is already being worked on in a branch, reuse it.
- If missing context prevents a safe plan, stop and ask the user for it instead of inventing assumptions.
- If the issue spans multiple roles, create separate per-role plan files and keep `plan.md` as the architect's coordination and delegation hub.
- If only the architect is responsible, create the issue brief, `plan.md`, and `architect.md`; do not add unrelated specialist plans.
- If a role needs multiple related plan documents, keep them under that role's subdirectory and link them from its entry-point plan.

## Final result

The skill must leave the repository on a dedicated `issue-<id>` branch with the issue brief and plan directory committed. The architect uses `docs/agents/plans/<id>-<slug>/plan.md` as the entry point, then delegates execution to the agents responsible for the linked plans.
