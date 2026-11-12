# Plan hub for issue #1761

## Objective

Correct the `plan issue` skill so generated planning documentation is grouped with the issue brief and the architect has a mandatory handoff document for coordinating delegated work.

## Read this first

The architect should begin with this file, then delegate the work described in [architect.md](architect.md) to the responsible agent. Each role-specific plan belongs in this directory and is owned by its responsible agent. For this documentation-only issue, the architect is the sole implementation owner; no backend or frontend plan is needed.

## Plan structure

- [architect.md](architect.md) — update the skill instructions, examples, and verification criteria.

## Coordination and delegation

The architect coordinates this issue by keeping the skill's workflow, output paths, and example tree consistent. When the skill is used for future issues with multiple responsibilities, `plan.md` must link every role plan and tell the architect which responsible agent to delegate each execution to. Each responsible agent authors its own `<agent>.md` plan; the architect uses this hub to track ownership and sequencing rather than writing specialist plans on their behalf.

## Sequence

1. Update `.github/skills/plan-issue.md` to specify the issue directory layout and mandatory `plan.md` hub.
2. Replace the old output example with the issue brief and plan files located together under `docs/agents/issues/<id>-<slug>/`.
3. Clarify that the architect reads `plan.md` first and delegates execution using its links and ownership information.
4. Check for contradictory old conventions in the skill, then review Markdown formatting.

## Verification

- The hub is described as required, canonical, and read first by the architect.
- The role files and issue brief are shown in the same issue directory.
- The skill assigns ownership of role-plan creation to the responsible agent and coordination to the architect.
- No contradictory `docs/agents/plans/<id>-<slug>/agent.md` instructions remain in the skill.
- Follow `docs/agents/documentation.md`; no local Markdown lint command is available.
