# Issue: Writting: split the 66-word host-tooling sentence at AGENTS.md:48 into shorter instructions

## Description
Codacy's Agentlinter scan (`clarity/sentence-complexity`, Comprehensibility, Info severity) flags `AGENTS.md:48` as an "overly complex sentence (66 words)". This is the paragraph starting "**Always run project commands through `docker-compose`.**", which was merged into a single rule by #1374 (following #1333).

## Expected Behavior
- [ ] The host-tooling rule is expressed in shorter sentences or a short list, none of them overly complex
- [ ] The rule's meaning is unchanged: project commands run through `docker-compose`; no host-level runtime/package-manager use unless the user asks in the current conversation; that request covers only the command it names and does not carry over to later commands
- [ ] Agentlinter's `sentence-complexity` finding clears for this file

## Solution
Docs only: break the long sentence into a few short instructions, keeping the `docker-compose` examples and the rationale (reproducible dependencies; the host may lack the runtime). Do not reintroduce the vague wording that #1333/#1374 removed.

## Benefits
- Easier for agents and humans to parse the rule
- Clears an Agentlinter finding

