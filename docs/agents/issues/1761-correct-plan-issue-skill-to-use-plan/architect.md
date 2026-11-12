# Architect plan for issue #1761

## Summary

Update `.github/skills/plan-issue.md` to make `docs/agents/issues/<id>-<slug>/plan.md` the required planning hub, with the issue brief and all role-specific plan files together under the same issue directory.

## Scope

- Revise the skill's workflow paths and required planning behavior.
- Require the architect to read `plan.md` first; define it as the summary, navigation, coordination, and delegation hub.
- Require one `<agent>.md` file per major responsibility, authored by the responsible agent.
- Update the expected output structure and remove the old plan-directory `agent.md` convention from the skill.
- Preserve the existing issue-reading, clarification, branch, and commit workflow.

## Dependencies

- Issue #1759 and the current `.github/skills/plan-issue.md` define the behavior being corrected.
- `AGENTS.md` and `docs/agents/documentation.md` provide repository documentation guidance.

## Execution steps

1. Replace the skill's issue brief and plan paths with the issue-directory layout specified by #1761.
2. Make `plan.md` mandatory, identify it as the architect's first read, and require it to link and summarize all role plans.
3. State that the architect coordinates and delegates execution, while each responsible agent creates its own plan file.
4. Rewrite the output example so the issue brief, `plan.md`, and role plans appear together under `docs/agents/issues/<id>-<slug>/`.
5. Review the skill for leftover or contradictory references to `docs/agents/plans/<id>-<slug>/agent.md`.
6. Check Markdown formatting by eye using `docs/agents/documentation.md`; no local Markdown lint command exists.

## Risks and mitigations

- **Conflicting old instructions:** search the skill for all old path and `agent.md` references, then read the whole file for inconsistencies.
- **Ambiguous ownership:** explicitly distinguish the architect's coordination responsibility from each role agent's responsibility for its own plan.
- **Scope creep into repository-wide conventions:** limit edits to the skill and its examples unless the issue's acceptance criteria require another file.

## Verification

- `plan.md` is required and described as the canonical hub and architect's first read.
- The output tree groups the issue brief and role plans beneath `docs/agents/issues/<id>-<slug>/`.
- The skill explains delegation and role-plan authorship consistently.
- No old plan-directory `agent.md` hub instruction remains in the skill.
- Markdown headings and lists follow `docs/agents/documentation.md`.
