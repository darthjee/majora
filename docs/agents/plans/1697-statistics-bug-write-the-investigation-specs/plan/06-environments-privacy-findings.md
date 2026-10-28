# Environments, privacy and findings pages

`environments.md`:

- Local vs. production differences: proxy configuration (`proxy/dev_configuration` vs.
  `proxy/prod_configuration`), HTTPS / `SESSION_COOKIE_SECURE`, `PROXY_SECRET` gate and client-IP
  resolution, possible edge proxy in front of Tent, MySQL datetime precision (needed before relying
  on "created milliseconds apart").
- How a production-only cause is confirmed: `analyse.py` evidence alone, documented as such.

`privacy.md`:

- Public repository: nothing committed contains real IPs, user ids, session ids, token values or
  secret values; examples use RFC 5737 ranges and made-up ids.
- Token in memory only, revoked at the end; reports git-ignored; anything copied into the repo or
  issues is aggregated/anonymised (masked IPs such as `203.0.113.x`).
- Exploitable findings are reported privately to the repository owner before any public write-up.
- Links to the investigator agent docs (#1698) for the general rules.

`findings.md`: placeholder — title, one line saying it is filled by #1704, and the expected
sections (root cause, evidence per hypothesis, reproducing scenario, proposed solution direction,
regression test scenario).

## Files to Change

- `docs/agents/specs/statistics-bug/environments.md` — new.
- `docs/agents/specs/statistics-bug/privacy.md` — new.
- `docs/agents/specs/statistics-bug/findings.md` — new placeholder.
