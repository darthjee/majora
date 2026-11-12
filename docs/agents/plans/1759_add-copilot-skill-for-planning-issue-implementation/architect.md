# Architect plan for issue #1759

## Goal

Create the first reusable planning skill in `.github/skills/` and document the resulting workflow under `docs/agents/`.

## Scope

- Add a custom Copilot skill named `plan issue`.
- Ensure the skill can work from an issue identifier and a repository with documentation conventions.
- Create issue and plan docs using the repository-specified naming conventions.
- Use a branch named `issue-<id>` and commit the work there.

## Workflow

1. Read `AGENTS.md` and the relevant `docs/agents/` guidance before writing the plan.
2. Interpret the issue and requirement details from #1759.
3. Ask for missing prior Copilot discussion if the current context does not contain it.
4. Clarify ambiguous scope before generating documentation if needed.
5. Create or switch to `issue-1759` from `main`.
6. Write `docs/agents/issues/1759_add-copilot-skill-for-planning-issue-implementation.md`.
7. Write the plan directory at `docs/agents/plans/1759_add-copilot-skill-for-planning-issue-implementation/`.
8. Add `agent.md` as the hub file and a role-specific coordinator file such as `architect.md`.
9. Delegate execution details to the relevant agents when role-specific work is needed.
10. Commit the generated documentation to the issue branch.

## File outputs

```text
docs/agents/issues/1759_add-copilot-skill-for-planning-issue-implementation.md
docs/agents/plans/1759_add-copilot-skill-for-planning-issue-implementation/agent.md
docs/agents/plans/1759_add-copilot-skill-for-planning-issue-implementation/architect.md
.github/skills/plan-issue.md
```

## Risk and mitigation

- Missing prior discussion: block on user input instead of proceeding with assumptions.
- Name drift: follow the issue ID and slug convention exactly.
- Scope creep: keep the implementation to planning documentation and skill definition only.

## Definition of done

- The skill exists at `.github/skills/plan-issue.md`.
- The issue brief exists under `docs/agents/issues/`.
- The plan directory exists and contains the agent hub and architect plan.
- The branch is `issue-1759` and the documentation changes are committed there.
