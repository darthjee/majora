# Add security agent

## Context

There is no agent dedicated to reviewing security concerns during the development workflow. Changes to Django views, serializers, or Tent proxy configuration may introduce vulnerability patterns (e.g., missing authentication, injection risks, insecure headers) without any systematic review. A dedicated read-only security agent would provide consistent, structured security reviews for high-risk changes.

## What needs to be done

**Docs:**
- Create `docs/agents/security-guidelines.md` documenting the project-specific vulnerability patterns to check (OWASP-style: authentication gaps, injection risks, insecure headers, exposed secrets, insecure proxy rules, etc.), with emphasis on the backend (Django) and proxy (Tent PHP configuration).

**Agent definitions:**
- Create `.claude/agents/security.md` with tools limited to Read and Bash (grep/diff reading), and a system prompt instructing it to review changes against the security-guidelines doc and report findings — no editing, read-only.
- Update `.claude/agents/architect.md` to instruct the architect to invoke the security agent when an issue involves new endpoints, authentication/authorization logic, proxy rule changes, or user input handling.

## Acceptance criteria

- [ ] `docs/agents/security-guidelines.md` exists and covers authentication gaps, injection risks, insecure headers, exposed secrets, and insecure proxy rules
- [ ] `.claude/agents/security.md` exists with Read and Bash tools only and a system prompt referencing the security-guidelines doc
- [ ] The architect agent definition instructs invocation of the security agent for new endpoints, auth/authz changes, proxy rule changes, and user input handling
- [ ] The security agent is read-only: it reports violations but does not edit files
