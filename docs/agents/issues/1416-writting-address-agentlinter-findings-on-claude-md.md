# Issue: Writting: address Agentlinter findings on CLAUDE.md

## Description
Codacy's Agentlinter scan flags four things on `CLAUDE.md` (currently a one-line pointer: "See [AGENTS.md](AGENTS.md) for project instructions."):
- `structure/has-version-or-update-date` — no version or update date
- `completeness/has-tools` — no tool documentation
- `structure/has-sections` — 0 `##` sections (aims for 3+)
- `completeness/has-identity` — no identity/persona defined

## Expected Behavior
- [ ] `CLAUDE.md` has at least 3 `##` sections (Project instructions, Tools, Identity), a `Last updated: YYYY-MM-DD` line, a short tools section and a short identity section
- [ ] `AGENTS.md` remains the single source of truth: `CLAUDE.md` links to it instead of duplicating its content
- [ ] The four Agentlinter findings clear for `CLAUDE.md`

## Solution
Docs only: restructure `CLAUDE.md` into small sections that each point to the relevant part of `AGENTS.md`, and keep it short.
- **Last updated:** add a plain `Last updated: <date>` line (hand-maintained; no extra process or contributing-doc note — it may drift, which is accepted).
- **Project instructions:** keep the link to `AGENTS.md` (and its docs index) as the entry point.
- **Tools:** a one-line summary — run all project commands through `docker-compose` / `make`, never use host runtimes — linking to `AGENTS.md#development`. This deliberately repeats one rule so the `has-tools` check has text in `CLAUDE.md` itself.
- **Identity:** a neutral one-liner, e.g. "You are a coding assistant working on Majora, an RPG campaign manager. `architect` coordinates cross-cutting work and delegates to the specialist agents in `.claude/agents/`." No behavioral rules restated; conventions stay in `AGENTS.md`.

## Benefits
- Clears four Agentlinter findings
- Gives agents a slightly clearer entry point while keeping one source of truth
