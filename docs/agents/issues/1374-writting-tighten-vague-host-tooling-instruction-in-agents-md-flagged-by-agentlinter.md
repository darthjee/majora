# Issue: Writting: tighten vague host-tooling instruction in AGENTS.md flagged by Agentlinter

## Description
Codacy's Agentlinter scan (`clarity/no-vague-instructions`, Comprehensibility, Info severity) flags the host-tooling instruction at `AGENTS.md:49` as vague: "Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine, unless the user explicitly asks for it." This follows issue #1333, which tightened ambiguous conditional language elsewhere in the same file.

## Problem
The rule leaves three things open for an AI agent reading it:
- What counts as the user "explicitly asking" — an inferred or earlier request could be mistaken for one.
- The tool list is open-ended (`etc.`).
- The rule is stated twice (`AGENTS.md:48` for project commands, `AGENTS.md:49` for package installs/tooling), each with its own "unless the user explicitly asks" clause, so line 48 carries the same vague phrase.

## Expected Behavior
A single, concrete host-tooling rule in `AGENTS.md` that:
- Defines an explicit request as one made in the current conversation for that specific command to run on the host. A request covers only the command it names and does not carry over to later commands.
- Replaces the open-ended `etc.` list with "any language runtime or package manager", keeping `yarn`, `npm`, `poetry`, `pip`, `php` as examples.
- No longer trips Agentlinter's `no-vague-instructions` check.

The rule's intent is unchanged: project commands and tooling run through `docker-compose`, never directly on the host, without an explicit request.

## Solution
Docs only: merge the two sentences at `AGENTS.md:48–49` into one rule (or otherwise define the "explicit request" clause once), applying the definitions above. Keep the wording consistent with what #1333 established, and keep the existing rationale (reproducible dependencies; the host may lack the runtime) and the `docker-compose` examples.

## Acceptance Criteria
- [ ] The host-tooling rule no longer trips Agentlinter's `no-vague-instructions` check
- [ ] "Explicitly asks" is defined once: current conversation, specific command, not carried over to later commands
- [ ] The tool list no longer ends in `etc.`
- [ ] The rule's intent is unchanged (no host-level installs or tooling without an explicit user request)
