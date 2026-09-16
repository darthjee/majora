# Issue: Writting: tighten ambiguous rule language in AGENTS.md flagged by Agentlinter

## Description
Codacy's Agentlinter (`clarity` category) flagged four lines in `AGENTS.md`'s dev-environment rules as ambiguous or absolute — harder for an agent (or a new contributor) to apply consistently than intended.

## Problem
- `AGENTS.md:48` — naked conditional: *"**Always run project commands through `docker-compose`.** (unless the user says otherwise)."* — doesn't say what form that override takes (a spoken request? a flag? a comment in the task?).
- `AGENTS.md:49` — naked conditional: *"Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine (unless the users says otherwise)."* — same issue, plus a typo ("the users says").
- `AGENTS.md:50` — escape-hatch-missing: *"the host may not even have the required runtime installed, and dependencies must stay reproducible inside the project's containers..."* — stated as an absolute rationale with no acknowledged exception.
- `AGENTS.md:64` — escape-hatch-missing: *"All documentation and code comments must be written in **English**."* — absolute, no stated exception for literal non-English user-facing strings/translations under `frontend/assets/i18n/`.

## Solution
Reword the four flagged lines to be concrete about what "otherwise" means in practice and/or to note the real, already-accepted exceptions — keeping the substance of each rule unchanged, this is a wording-only tightening:

- `AGENTS.md:48` → *"**Always run project commands through `docker-compose`**, unless the user explicitly asks for a command to be run directly on the host machine."*
- `AGENTS.md:49` → *"Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine, unless the user explicitly asks for it."* (also fixes the "the users says" typo)
- `AGENTS.md:50` → keep the reproducibility rationale, but phrase it as the reason for the default above rather than a separate absolute claim, e.g. *"This keeps dependencies reproducible inside the project's containers — the host machine may not even have the required runtime installed."*
- `AGENTS.md:64` → *"All documentation and code comments must be written in **English**, except for literal non-English user-facing strings (e.g. translation values under `frontend/assets/i18n/`), which are quoted as-is."*

## Benefits
- Unambiguous rules that agents and contributors can apply consistently, without guessing what an "unless the user says otherwise" override looks like in practice.
- No change to actual policy — pure clarity/wording improvement, resolving the Agentlinter findings.
