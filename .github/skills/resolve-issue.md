---
name: resolve issue
description: Execute a planned Majora issue from its issue branch by reading the issue brief and plan, delegating work through the architect, committing agent changes, and opening a PR when validation passes.
parameters:
  - name: issue_id
    type: integer
    description: GitHub issue number of the already planned issue to resolve.
---

# Resolve issue

Execute an already planned Majora issue from its dedicated issue branch.

## Goal

For the given issue id, use the repository's existing issue-planning conventions to carry the issue from implementation into a reviewed pull request without guessing at scope or ownership.

## Inputs

- GitHub issue number: `<issue_id>`
- Existing branch: `issue-<id>`
- Issue brief: `docs/agents/issues/<id>-<slug>.md`
- Implementation plan: `docs/agents/plans/<id>-<slug>/plan.md`
- Project guidance: `AGENTS.md` and the relevant `docs/agents/` files
- Any required issue comments or local repo state needed to complete the plan

## Required workflow

1. Read the issue and its documentation in the repository before changing code.
2. Confirm the branch is `issue-<id>`. Create it from `main` if the branch does not exist.
3. Read `docs/agents/issues/<id>-<slug>.md` when the issue brief provides scope, constraints, or acceptance criteria that matter to implementation.
4. Read `docs/agents/plans/<id>-<slug>/plan.md` first. Treat it as the architect's coordination hub and the source of sequencing, ownership, and delegation.
5. Have the architect distribute tasks to the relevant agents using the plan's role-specific responsibilities.
6. Ask for missing context or clarify ambiguous requirements before proceeding if the plan or issue brief is incomplete.
7. Execute the implementation work assigned to each agent, keeping changes focused and aligned with the plan.
8. Make each agent commit its own related work separately when its portion is complete, while preserving the issue branch.
9. Validate the affected stack using the same checks listed in the plan and repository conventions. Stop immediately on failing validation and report the failure instead of proceeding with a misleading PR.
10. Once all required work is complete and validations pass, open a pull request against the correct base branch with a clear summary and link to the issue.

## Expected behavior

- Prefer the existing issue brief and implementation plan over ad hoc assumptions.
- Treat the issue branch as the canonical execution context.
- Keep the architect responsible for coordination even when the implementation is split across multiple agents.
- Commit only the code and docs needed to resolve the planned issue.
- If the environment cannot write to the repository or open a PR, explain the blocker and do not claim a completed PR was created.

## Decision rules

- If the issue is already being worked on in `issue-<id>`, reuse that branch.
- If the issue brief and plan are missing or incomplete, stop and request the missing files or clarification instead of inventing work.
- If the plan is multi-agent, delegate by role and keep the architect in charge of coordination.
- If only the architect is needed, keep the flow narrow and avoid adding unrelated work.
- If validation fails, report the failing checks and fix the root cause before opening the PR.

## Required output

The skill must leave the repository in a ready-to-review state:

- the issue branch is active;
- the implementation was completed according to the plan;
- agent commits exist for the relevant work;
- required validation completed successfully;
- a PR is opened with a summary referencing the issue.

## Final result

This skill is for the case where a Majora issue has already been planned and documented. It should coordinate execution of that plan, not create the issue or plan from scratch. The work ends in a verified, committed implementation and a pull request when the environment permits repository writes and PR creation.
