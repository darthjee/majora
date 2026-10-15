# Writting: tighten vague host-tooling instruction in AGENTS.md flagged by Agentlinter

## Context

Codacy's Agentlinter scan (`clarity/no-vague-instructions`, Comprehensibility, Info severity) flags the instruction at `AGENTS.md:49` — "Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine, unless the user explicitly asks for it." — as vague. This follows the same pattern as issue #1333 (already fixed for a different AGENTS.md rule), where Agentlinter flagged ambiguous conditional language in project instructions consumed by AI agents.

## What needs to be done

Docs: reword `AGENTS.md:49` to be more concrete about what counts as "the user explicitly asks for it" (e.g. clarify it means an explicit, unambiguous request in the current conversation, not an inferred one), consistent with how issue #1333 tightened similar language elsewhere in the file.

## Acceptance criteria

- [ ] AGENTS.md:49's host-tooling rule no longer trips Agentlinter's `no-vague-instructions` check
- [ ] The rule's intent (don't run yarn/npm/poetry/pip/php etc. on the host without explicit request) is unchanged
