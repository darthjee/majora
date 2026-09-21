# Plan: Writting: split the 66-word host-tooling sentence at AGENTS.md:48 into shorter instructions

Issue: [1414-writting-split-the-66-word-host-tooling-sentence-at-agents-md-48-into-shorter-instructions.md](../../issues/1414-writting-split-the-66-word-host-tooling-sentence-at-agents-md-48-into-shorter-instructions.md)

## Overview
Docs-only change. Rewrite the host-tooling paragraph in `AGENTS.md` (line 48) so that the single 66-word rule sentence becomes a short lead-in plus a few short bullets, clearing Codacy's Agentlinter `clarity/sentence-complexity` finding. The meaning of the rule stays exactly as merged by #1333/#1374.

## Context
The paragraph starting "**Always run project commands through `docker-compose`.**" currently packs three ideas into one sentence: never install packages or invoke a runtime/package manager on the host, the exception (user asks in the current conversation), and the exception's scope (only the named command, not later ones). Agentlinter flags it as overly complex (66 words).

The rule appears only once in `AGENTS.md`. The `.claude/agents/*.md` files carry their own, differently worded host-tooling reminders; they are out of scope for this issue.

This is a root-level file, so it belongs to the architect; no specialist agent has work.

## Implementation Steps

### Step 1 — Rewrite the paragraph at `AGENTS.md:48`
Replace the current paragraph (the bold lead-in, the long rule sentence, and the rationale line) with:

```markdown
**Always run project commands through `docker-compose`.**

- Never install packages on the host machine.
- Never invoke a language runtime or package manager (e.g. `yarn`, `npm`, `poetry`, `pip`, `php`) on the host.
- The only exception is a request from the user, in the current conversation, to run a specific command on the host.
- That request covers only the command it names. It does not carry over to later commands.

This keeps dependencies reproducible inside the project's containers. The host machine may not even have the required runtime installed. Examples:
```

Keep the existing `docker-compose run --rm majora_fe yarn lint` / `docker-compose run --rm majora_tests pytest` code block directly after it, unchanged. Each sentence should stay well under ~25 words. Do not reintroduce the vague wording that #1333/#1374 removed (e.g. no "unless told otherwise" or open-ended exceptions).

### Step 2 — Verify
- Re-read the edited paragraph against the issue's three expected-behavior checkboxes: shorter sentences, meaning unchanged, and the exception's per-command scope still explicit.
- Confirm the Markdown renders correctly (blank line before the list, list directly followed by the rationale paragraph, code block intact).
- After merge, confirm the Agentlinter finding for `AGENTS.md` clears on Codacy (cannot be checked locally).

## Files to Change
- `AGENTS.md` — split the long host-tooling sentence at line 48 into a lead-in, four short bullets, and a two-sentence rationale.

## CI Checks
No CircleCI job lints `AGENTS.md`. The relevant check is Codacy's Agentlinter (`clarity/sentence-complexity`), which runs on the PR.

## Notes
- Sentence count matters more than bullet count for the linter, so keep each bullet a single short sentence.
- Do not touch the `.claude/agents/*.md` host-tooling reminders; they are separate and not flagged by this issue.
