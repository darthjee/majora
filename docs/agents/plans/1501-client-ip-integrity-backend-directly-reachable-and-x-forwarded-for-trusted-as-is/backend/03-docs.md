# Correct the docs
Make the docs describe the real topology: Django is a public Render web service that Tent reaches over the internet. Client IP trust comes from the `X-Proxy-Secret` gate, not from Django being unreachable.

- `docs/agents/access-control/game.md`: fix the "Django is never reached directly by an external client" statement. Say explicitly that `X-Forwarded-Host` (and therefore the domain gate) is still spoofable by direct callers until a follow-up applies the same secret gate.
- `docs/agents/specs/access-statistics/access-and-security.md`, "Client IP integrity": describe the secret gate, leftmost-entry parsing and the `REMOTE_ADDR` fallback. Replace the "best effort and spoofable until #1501" note. Keep a caveat that an edge proxy in front of Tent, not yet verified, would make Tent's `REMOTE_ADDR` the edge's IP.
- `docs/agents/specs/access-statistics/shared-infrastructure.md`, "Production topology check": add a short note on how #1501 resolved the findings and what remains to verify after deploy.
- `backend/majora_project/settings.py`: correct the comment above `USE_X_FORWARDED_HOST`, which assumes Tent is the only way to reach Django.
- Document `PROXY_SECRET` wherever deploy and env vars are documented, e.g. next to the `STATISTICS_SKIP_SECRET` mention in `docs/agents/cache-warmer.md` or the deploy docs. Include the manual prod setup: the Render env var plus `$proxySecret` in the server-side Tent `locals.php`.
- Add the manual post-deploy check from the issue (forged header through Tent and directly; Tent's `REMOTE_ADDR` compared with the real IP) to the access-and-security page.

## Files to Change
- `docs/agents/access-control/game.md`: real topology; `X-Forwarded-Host` caveat.
- `docs/agents/specs/access-statistics/access-and-security.md`: IP integrity section; post-deploy check.
- `docs/agents/specs/access-statistics/shared-infrastructure.md`: resolution note.
- `backend/majora_project/settings.py`: comment fix only.
- Deploy and env-var docs: `PROXY_SECRET`.
