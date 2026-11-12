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
5. Create the issue package directory at `docs/agents/issues/<id>-<slug>/`, where `<slug>` is the issue title lowercased with spaces replaced by hyphens.
6. Write the issue brief to `docs/agents/issues/<id>-<slug>/issue.md`.
7. Write the required plan hub to `docs/agents/issues/<id>-<slug>/plan.md`. The architect must read this file first. It summarizes the plan, links every role-specific plan, and tells the architect how to coordinate and delegate execution.
8. Create one role-specific file per major agent responsibility in the same directory, named `<agent>.md` (for example, `architect.md`, `backend.md`, or `frontend.md`). The responsible agent writes its own plan. The architect coordinates, maintains `plan.md`, and delegates execution using its links and ownership information. Do not create a role file for work the issue does not require.
9. Commit only the documentation changes produced by the planning process to the issue branch.

## Expected output structure

```text
docs/
  agents/
    issues/
      1759-add-copilot-skill-for-planning-issue-implementation/
        issue.md
        plan.md
        architect.md
        backend.md
```

`architect.md` and `backend.md` are examples; include only roles needed by the issue. `plan.md` is always required, even when the architect is the only responsible agent.

## Required behavior

- Prefer the issue title and repository docs as the authority for naming and scope.
- Use the issue ID as the canonical identifier for the branch and issue-package directory.
- Keep role-specific execution plans in the issue-package directory; do not create a parallel directory under `docs/agents/plans/` for this workflow.
- Treat `plan.md` as the canonical hub and the architect's first read, not as an optional file. It must link all role plans and explain ownership, sequencing, and delegation.
- Keep the plan split by agent responsibility instead of mixing all work into one file. Each responsible agent authors its own plan; the architect coordinates them.
- Use clear technical sections: summary, scope, dependencies, execution steps, risks, and verification.
- Keep documentation in English.
- Commit only the documentation changes produced by the planning process.

## Decision rules

- If the issue is already being worked on in a branch, reuse it.
- If missing context prevents a safe plan, stop and ask the user for it instead of inventing assumptions.
- If the issue spans multiple roles, create separate per-role plan files and keep `plan.md` as the architect's coordination and delegation hub.
- If only the architect is responsible, create `issue.md`, `plan.md`, and `architect.md`; do not add unrelated specialist plans.

## Final result

The skill must leave the repository on a dedicated `issue-<id>` branch with the issue package (`issue.md`, `plan.md`, and applicable role plans) committed. The architect uses `plan.md` as the entry point to delegate the planned execution to the responsible agents.
