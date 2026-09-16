# Plan: Writting: tighten ambiguous rule language in AGENTS.md flagged by Agentlinter

Issue: [1333-writting-tighten-ambiguous-rule-language-in-agents-md-flagged-by-agentlinter.md](../../issues/1333-writting-tighten-ambiguous-rule-language-in-agents-md-flagged-by-agentlinter.md)

## Overview
Codacy's Agentlinter flagged four lines in `AGENTS.md`'s dev-environment rules (lines 48–50 and 64) as ambiguous naked conditionals or absolute statements missing an escape hatch. This plan tightens the wording of those four lines only, without changing the underlying policy.

## Context
- `AGENTS.md:48` and `AGENTS.md:49` say "unless the user says otherwise" without specifying what form that override takes.
- `AGENTS.md:50` states the containerization rationale as an unqualified absolute.
- `AGENTS.md:64` states the English-only rule as an unqualified absolute, with no acknowledgment of literal non-English strings (e.g. translation values under `frontend/assets/i18n/`).
- This is a root-level, cross-cutting documentation change with no agent-specific code impact, so it's owned by the architect directly rather than split across specialists.

## Implementation Steps

### Step 1 — Reword the four flagged lines in AGENTS.md
Edit `AGENTS.md` lines 48–50 and 64 to the following, preserving the substance of each rule:

- Line 48 → `**Always run project commands through `docker-compose`**, unless the user explicitly asks for a command to be run directly on the host machine.`
- Line 49 → `Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine, unless the user explicitly asks for it.` (also fixes the existing "the users says" typo)
- Line 50 → `This keeps dependencies reproducible inside the project's containers — the host machine may not even have the required runtime installed.`
- Line 64 → `All documentation and code comments must be written in **English**, except for literal non-English user-facing strings (e.g. translation values under `frontend/assets/i18n/`), which are quoted as-is.`

## Files to Change
- `AGENTS.md` — reword lines 48, 49, 50, and 64 per Step 1.

## CI Checks
- root (`AGENTS.md`): `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes
- Wording-only change — no behavioral/policy change, so no tests beyond markdownlint apply.
