# Plan: Add security agent

Issue: [128-add-security-agent.md](../issues/128-add-security-agent.md)

## Overview

Create a read-only `security` agent and an accompanying `docs/agents/security-guidelines.md` reference document. The security agent reviews diffs and changed files against the guidelines and reports violations to the architect — it never edits files. Update the architect's own definition to instruct it to invoke the security agent for high-risk changes (new endpoints, auth/authz changes, proxy rule changes, user input handling).

## Context

Currently there is no systematic security review in the development workflow. The `data-access` agent (added in issue #129) covers access-control violations, but no agent is responsible for broader security concerns such as injection risks, insecure headers, missing CSRF protection, or insecure proxy rules. This gap is most relevant for the Django backend and the Tent PHP proxy, both of which handle user-facing request processing.

## Implementation Steps

### Step 1 — Create `docs/agents/security-guidelines.md`

Write a new Markdown document at `docs/agents/security-guidelines.md` covering the project-specific vulnerability patterns to check. Organise it in the style of the existing `docs/agents/access-control.md` reference — concise, rule-based, and keyed to Majora's actual stack (Django + Tent PHP).

Sections to include:
- **Authentication gaps** — all non-trivial endpoints must use `@permission_classes` or equivalent; `AllowAny` requires explicit justification.
- **Injection risks** — Django ORM usage (avoid raw `filter(**user_input)`, `extra()`, `RawSQL()`); PHP proxy config should not interpolate request data into shell or eval calls.
- **Insecure headers** — responses should include security headers (e.g. `X-Content-Type-Options`, `X-Frame-Options`); Tent proxy rules should not strip or override these.
- **Exposed secrets** — no credentials, tokens, or secret keys in source files, Docker configs, or proxy rules; `.env` files must be excluded from version control.
- **CSRF** — Django REST Framework endpoints consumed by the SPA must have DRF's CSRF enforcement in place (or use token-based auth with `SessionAuthentication` properly); exempt only where justified.
- **Insecure proxy rules** — Tent `rules/*.php` must not expose unintended paths, must not forward sensitive headers to untrusted upstreams, and should restrict HTTP methods where appropriate.
- **Input validation** — serializer fields should declare explicit types and validators; avoid passing unsanitised request data to file paths, shell commands, or third-party services.

### Step 2 — Create `.claude/agents/security.md`

Create the agent definition file. Follow the exact front-matter format used by the existing agents (e.g. `.claude/agents/data-access.md`):

```markdown
---
name: security
description: Read-only security reviewer. Use when an issue involves new endpoints, authentication/authorization logic, proxy rule changes, or user input handling. Reads the security-guidelines doc and the diff, then reports findings — never edits files.
tools: Read, Bash
---
```

The system prompt should instruct the agent to:
- Read `docs/agents/security-guidelines.md` first as the authoritative checklist.
- Accept a list of changed files and/or a diff from the architect.
- Check each changed file against every relevant guideline section.
- Produce a structured report (`SECURITY REVIEW: CLEAN` or `SECURITY REVIEW: FINDINGS`) modelled on the `data-access` agent's output format.
- Never edit files; never apply fixes; report only.

### Step 3 — Update `.claude/agents/architect.md`

Add a **Security review** section (analogous to the existing "Data access control review" section) instructing the architect to invoke the `security` agent when an issue involves:

- A new API endpoint
- Authentication or authorization logic changes
- Tent proxy rule changes
- User input handling (new serializer fields that accept user data, new form or query-param processing)

The section should specify: dispatch `security` with the list of changed files and/or a diff; if it reports findings, delegate the required corrections to the appropriate specialist agent (`backend` or `infra`); then re-invoke `security` to confirm the findings are resolved before merging.

### Step 4 — Update `AGENTS.md`

Add the `security` agent to the Documentation table in `AGENTS.md` and to the specialist-agent table in the architect's system prompt, consistent with how `data-access` was added.

Add `docs/agents/security-guidelines.md` to the documentation table in `AGENTS.md`.

## Files to Change

- `docs/agents/security-guidelines.md` — create; security checklist document
- `.claude/agents/security.md` — create; agent definition (Read + Bash tools, read-only)
- `.claude/agents/architect.md` — update; add Security review coordination instructions
- `AGENTS.md` — update; add security agent row and security-guidelines doc row

## Notes

- Model the agent definition and output format closely on `.claude/agents/data-access.md` for consistency.
- The security agent is intentionally broad — it does not replace the `data-access` agent (which focuses on per-role access-control rules) but complements it with OWASP-style vulnerability pattern checks.
- No CI job changes are needed — this issue touches only documentation and agent-definition files, none of which are exercised by the existing pytest or Jasmine CI jobs.
