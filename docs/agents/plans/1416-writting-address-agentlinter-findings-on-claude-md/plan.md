# Plan: Writting: address Agentlinter findings on CLAUDE.md

Issue: [1416-writting-address-agentlinter-findings-on-claude-md.md](../../issues/1416-writting-address-agentlinter-findings-on-claude-md.md)

## Overview
Restructure the root-level `CLAUDE.md` (currently a one-line pointer to `AGENTS.md`) into three short `##` sections plus a `Last updated` line, so the four Codacy Agentlinter findings clear while `AGENTS.md` stays the single source of truth. This is a docs-only, root-level change, so it is owned by `architect` — no specialist agent's scope (`backend/`, `frontend/`, `proxy/`, etc.) is involved.

## Context
Agentlinter flags `CLAUDE.md` for: `structure/has-version-or-update-date`, `completeness/has-tools`, `structure/has-sections` (0 `##` sections, wants 3+) and `completeness/has-identity`. Decisions from the issue discussion:
- The date is a plain, hand-maintained `Last updated:` line; no contributing-doc note or other process (drift is accepted).
- The Tools section deliberately repeats one rule (docker-compose-only) so the `has-tools` check has text in `CLAUDE.md` itself, and links to `AGENTS.md#development`.
- The Identity section is a neutral one-liner; no behavioral rules are restated.

## Implementation Steps

### Step 1 — Rewrite `CLAUDE.md`
Replace the file content with a short document shaped like:

```markdown
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
```

Use the real date at implementation time for `Last updated`. Keep lines within the markdownlint limits (see `.markdownlint-cli2.jsonc`), and keep a blank line around headings and a single top-level heading.

### Step 2 — Verify
- Run the markdown lint through docker-compose (never on the host), e.g. `docker-compose run --rm markdownlint`, and fix anything it reports for `CLAUDE.md`.
- Confirm the four Agentlinter conditions by inspection: ≥3 `##` sections, a `Last updated: YYYY-MM-DD` line, tool text present, identity text present. (The Agentlinter re-scan itself runs in Codacy after the PR.)

## Files to Change
- `CLAUDE.md` — restructure into Project instructions / Tools / Identity sections with a `Last updated` line.

## CI Checks
- repo root: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes
- `AGENTS.md` is intentionally untouched. The heading anchors `#development` and `#documentation` must match the existing `## Development` and `## Documentation` headings in `AGENTS.md`.
- The `Last updated` line is hand-maintained and may go stale; this is accepted per the issue discussion.
- Codacy's Agentlinter can only be confirmed after the PR is scanned; local verification is limited to markdownlint plus inspection.
