# Issue plan hub

This directory contains the implementation plan for issue #1759.

## Files

- `architect.md` — overall coordination, delegation, and sequencing
- `agent.md` — hub summary for the issue plan and links to role-specific files

## Objective

Implement the first Copilot planning skill so Majora can turn a GitHub issue into documentation-ready execution steps and a committed issue branch.

## Agent routing

- `architect` owns the overall plan and the delegation model.
- `backend` and `frontend` are consulted only when the issue requires implementation work outside the skill definition itself.
- Documentation-only changes remain in `docs/agents/` and `.github/skills/`.
