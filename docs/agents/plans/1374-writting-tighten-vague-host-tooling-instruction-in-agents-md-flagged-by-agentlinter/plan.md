# Plan: Writting: tighten vague host-tooling instruction in AGENTS.md flagged by Agentlinter

Issue: [1374-writting-tighten-vague-host-tooling-instruction-in-agents-md-flagged-by-agentlinter.md](../../issues/1374-writting-tighten-vague-host-tooling-instruction-in-agents-md-flagged-by-agentlinter.md)

## Overview

Rewrite the host-tooling rule in the root `AGENTS.md` (currently two overlapping sentences at lines 48–49) into a single, concrete rule. It defines an "explicit request" once, replaces the open-ended `etc.` tool list with a category plus examples, and keeps the rule's intent unchanged. This is a docs-only change to a root-level file, so no specialist agent owns it.

## Context

Codacy's Agentlinter (`clarity/no-vague-instructions`) flags `AGENTS.md:49`. Both line 48 (`Always run project commands through docker-compose, unless the user explicitly asks…`) and line 49 (`Never install packages or invoke tooling (…, etc.) … unless the user explicitly asks for it.`) carry the same undefined "explicitly asks" clause. Issue #1333 (commit `28e83a55`) previously reworded these lines from "unless the user says otherwise" to the current form; this issue finishes that tightening.

Decisions from the issue discussion:

- Merge lines 48 and 49 into one rule so the exception is defined only once.
- "Explicitly asks" means a request made in the current conversation, for a specific command to run on the host. It covers only the command it names and does not carry over to later commands.
- Replace `(yarn, npm, poetry, pip, php, etc.)` with "any language runtime or package manager", keeping those tools as examples.

## Implementation Steps

### Step 1 — Merge and reword the host-tooling rule

Replace lines 48–49 of `AGENTS.md` with a single paragraph along these lines (final wording at the implementer's discretion, as long as the three decisions above are met):

```markdown
**Always run project commands through `docker-compose`.** Never install packages or invoke any language runtime or package manager (e.g. `yarn`, `npm`, `poetry`, `pip`, `php`) directly on the host machine. The only exception is when the user asks, in the current conversation, for a specific command to be run on the host; that request covers only the command it names and does not carry over to later commands.
This keeps dependencies reproducible inside the project's containers — the host machine may not even have the required runtime installed. Examples:
```

Keep the existing `docker-compose run --rm majora_fe yarn lint` / `majora_tests pytest` example block below it unchanged. Do not touch other rules in the file.

### Step 2 — Verify

- Run markdownlint through docker-compose (see CI Checks) to confirm the edit doesn't break the Markdown lint job.
- Re-read the resulting paragraph and confirm no other sentence in `AGENTS.md` still says "unless the user explicitly asks" for host commands.

## Files to Change

- `AGENTS.md` — merge and reword the two host-tooling sentences (lines 48–49) into one rule.

## CI Checks

- root: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- Agentlinter runs through Codacy, so the `no-vague-instructions` result can only be confirmed after the change is pushed and the Codacy scan re-runs. There is no local command for it.
- Behavior is unchanged: this stays a wording-only edit.
