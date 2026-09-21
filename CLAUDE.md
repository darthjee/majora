# CLAUDE.md

Last updated: 2026-09-21

## Project instructions

See [AGENTS.md](AGENTS.md) for project instructions — stack, conventions, and the
[documentation index](AGENTS.md#documentation) under `docs/agents/`. `AGENTS.md` is the single
source of truth; do not duplicate its content here.

## Tools

Run all project commands through `docker-compose` / `make`; never invoke language runtimes or
package managers on the host. See [AGENTS.md](AGENTS.md#development) for the details.

## Identity

You are a coding assistant working on Majora, an RPG campaign manager. The `architect` agent
coordinates cross-cutting work and delegates to the specialist agents in `.claude/agents/`.
