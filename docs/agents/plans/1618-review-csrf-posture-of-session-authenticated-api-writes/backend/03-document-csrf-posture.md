# Document the CSRF posture

Update the CSRF security guideline with the decided posture, replacing the "The project-wide
posture is reviewed in #1618" note and the per-view `JSONParser` advice:

- Session-authenticated API writes do not use CSRF tokens. They are protected by
  `SESSION_COOKIE_SAMESITE = 'Lax'` (cross-site), CORS without credentials (preflighted
  cross-origin), and JSON-only request bodies project-wide (`DEFAULT_PARSER_CLASSES`), so a
  same-site HTML form POST gets `415`.
- As far as known, no same-site origin other than Majora is served; the JSON-only rule is
  defense in depth.
- Never add `FormParser`/`MultiPartParser` (or a non-JSON parser) to a session-authenticated
  endpoint without documenting why here; file uploads go through the proxy, not Django.

Check whether `docs/agents/security-guidelines.md` or `.claude/agents/security.md` repeat the
per-view `JSONParser` advice, and align them.

## Files to Change

- `docs/agents/security-guidelines/csrf.md` — record the decided posture.
- `docs/agents/security-guidelines.md`, `.claude/agents/security.md` — only if they repeat the
  outdated advice.
