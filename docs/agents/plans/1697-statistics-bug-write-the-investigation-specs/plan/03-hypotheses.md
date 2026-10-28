# Hypotheses page

`hypotheses.md` — one entry per hypothesis, each with: description, code involved, the emulation
scenario that would reproduce it, the production pattern `analyse.py` would show, and a status
(open / confirmed / ruled out). The page is open: later sub-issues append new hypotheses here.

Entries:

1. **IP flip from Tent custom handlers (top suspect).** Per `docs/agents/statistics.md`
   *Client IP integrity*, requests served by `cache.php`, `delete.php`, `uploads.php` drop
   `X-Proxy-Secret` / `X-Forwarded-For`, so Django records Tent's IP. Mixing standard-rule and
   custom-handler requests during navigation/refresh flips `session.ip` → new session. Code:
   `backend/common/client_ip.py`, `proxy/extension/`, `StatisticsSessionMiddleware._load_or_create_session`.
2. **Refresh + parallel requests:** (a) no-cookie race on first load — each parallel request
   creates a `Session`, last `Set-Cookie` wins, the rest are single-hit orphans; (b) login-rotation
   race — each parallel authenticated request rotates the same anonymous session in
   `_backfill_user`; (c) `Set-Cookie` ordering — a slower earlier response overwrites a newer
   cookie.
3. **Other IP change:** IPv4/IPv6 switching, mobile networks, edge proxy/CDN caveat.
4. **Domain mismatch:** host variations (`www.`, port, unregistered host → `None` domain).
5. **Proxy/cache replaying `Set-Cookie`:** a cached response carrying another session's cookie.
   Stated as what to verify only — no exploitation steps.
6. **Cookie not stored/sent:** `Secure`, `SameSite=Lax`, domain/path, max-age.

## Files to Change

- `docs/agents/specs/statistics-bug/hypotheses.md` — new.
