# Add Copilot skill for planning issue implementation

## Summary

Add a Copilot skill under `.github/skills/` invoked as `plan issue <id>` to plan implementation work for a Majora GitHub issue. The skill should read the issue and its comments, incorporate available prior Copilot discussion, ask clarifying questions when needed, and produce issue and plan documentation on a dedicated branch.

## Motivation

Majora documents architecture and execution plans under `docs/agents/`. This issue formalizes a reusable planning flow so that new work can be captured in a consistent structure before implementation starts.

## Requirements

- Support the command `plan issue <id>`.
- Read the target issue and available issue comments.
- Use relevant prior Copilot chat discussion when present.
- Ask the user for missing prior discussion when it is not available in the current context.
- Ask clarifying questions before drafting the plan if scope is ambiguous.
- Reuse or create a branch named `issue-<id>`, created from `main` if needed.
- Create `docs/agents/issues/<id>-<slug>.md` using the issue title as the slug.
- Create `docs/agents/plans/<id>-<slug>/` with role-based plan files.
- When useful, include a hub file named `agent.md` that links the role-specific plans.
- Delegate each detailed agent plan to the corresponding agent, while the architect coordinates the overall flow.
- Commit the generated documentation on the issue branch.

## Naming convention

- Issue doc: `docs/agents/issues/<issue_id>-<issue_title_slug>.md`
- Plan directory: `docs/agents/plans/<issue_id>-<issue_title_slug>/`
- Example: `docs/agents/issues/1759_add-copilot-skill-for-planning-issue-implementation.md`

## Acceptance criteria

- The skill can be invoked with `plan issue <id>`.
- It reads the issue and issue comments and incorporates relevant prior Copilot discussion if available.
- It asks the user for missing discussion prior to planning.
- It asks clarifying questions when needed before writing a plan.
- It reuses the existing `issue-<id>` branch or creates it from `main`.
- It creates the issue brief and role-specific plan files in the documented locations.
- It delegates each role's detailed plan to the responsible agent.
- It commits the generated documentation to the issue branch.

## Notes

This issue establishes the first reusable Copilot planning skill under `.github/skills/` and the corresponding documentation pattern under `docs/agents/`.
