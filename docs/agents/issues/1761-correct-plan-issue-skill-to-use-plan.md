# Issue #1761: Correct plan-issue skill to use plan.md as the delegation hub

## Summary

Update `.github/skills/plan-issue.md` so every issue planning package has one canonical hub at `docs/agents/issues/<id>-<slug>/plan.md`. The hub is the architect's entry point and coordinates delegation to role-specific plans in the same directory.

## Problem

The current skill places role plans in `docs/agents/plans/<id>-<slug>/` and describes an optional `agent.md` hub. This separates the plan from its issue brief and does not establish a required, canonical entry point for the architect to use when delegating execution.

## Scope

- Revise `.github/skills/plan-issue.md` workflow and path conventions.
- Put the issue brief and its role-based planning package together under `docs/agents/issues/<id>-<slug>/`.
- Define `plan.md` as the required hub: the architect reads it first, it summarizes the work and links role plans, and it explains coordination and delegation.
- Keep one role-specific file per major responsibility, named `<agent>.md`; the responsible agent owns its plan, with the architect coordinating.
- Update the expected output tree and remove contradictory instructions for the old `docs/agents/plans/<id>-<slug>/agent.md` convention.

Out of scope: changing unrelated documentation conventions or migrating existing issue plans. Preserve the skill's existing issue research, clarification, branch, and commit requirements.

## Dependencies

- Issue #1759 introduced the skill and provides the prior planning convention being corrected.
- Repository guidance in `AGENTS.md` and `docs/agents/documentation.md` applies to paths and Markdown formatting.

## Execution

See [plan.md](1761-correct-plan-issue-skill-to-use-plan/plan.md) for the coordination hub and [architect.md](1761-correct-plan-issue-skill-to-use-plan/architect.md) for the role-specific execution plan.

## Risks

- Leaving a stale path or optional `agent.md` reference in the skill could preserve the competing convention.
- Changing the issue brief naming/path beyond the requested plan-package layout could conflict with repository guidance; keep the issue brief and plan directory together as specified by this issue.
- Old historical plans may still use the former layout; do not treat them as current skill instructions or modify them in this issue.

## Verification

- Review `.github/skills/plan-issue.md` for consistent paths, required hub behavior, and delegation wording.
- Confirm its example tree contains the issue brief, `plan.md`, and role-specific files together under `docs/agents/issues/<id>-<slug>/`.
- Search the skill for contradictory references to the old plan-directory hub pattern.
- Review Markdown formatting against `docs/agents/documentation.md`; there is no local markdown lint command in this repository.
