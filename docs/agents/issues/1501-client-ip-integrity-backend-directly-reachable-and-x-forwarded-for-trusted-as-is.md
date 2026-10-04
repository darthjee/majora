# Issue: Client IP integrity: backend directly reachable and X-Forwarded-For trusted as-is

## Description
Follow-up from #1482's production topology check (see `docs/agents/specs/access-statistics/shared-infrastructure.md`, "Production topology check"). The access statistics spec assumes stored client IPs cannot be spoofed, because Tent's `SetClientIpMiddleware` replaces `X-Forwarded-For` with its own `REMOTE_ADDR`. In production that assumption does not hold.

## Problem
- **Django is directly reachable.** It runs as a public Render web service (`scripts/render.sh`, `backend/bin/server.sh`), and Tent reaches it over the internet. Any client can call it directly with a forged `X-Forwarded-For`. `ALLOWED_HOSTS` defaults to `*`.
- **What sits in front of Tent is not defined in the repo** (DNS/CDN for the Tent host, the deploy-time `.htaccess`). If an edge proxy sits in front of Tent, Tent's `REMOTE_ADDR` is the edge's IP, and nothing restores the real one.
- **The Tent -> Render hop** may append to the header. Render/edge behavior is not defined in the repo.
- `SetClientIpMiddleware` is wired only on `proxy/prod_configuration/rules/backend.php`, not on `private_game_data_cache.php`, `admin.php` or `redirects.php`.
- `StatisticsSessionMiddleware._client_ip` (`backend/statistics/middleware.py`) stores the raw `X-Forwarded-For` (no comma split, no trusted-hop count) into a `GenericIPAddressField`. A multi-value header can also fail validation. The same IP is compared against `session.ip` to decide whether a cookie-borne session is reused, so a spoofed or unstable IP also affects session continuity.
- `docs/agents/access-control/game.md` states Django is never reached directly by an external client. That doesn't match this topology, and neither does the premise behind the `USE_X_FORWARDED_HOST` note in `settings.py`.

## Expected Behavior
- A client cannot make Django record an IP of its choosing. Django trusts `X-Forwarded-For` only on requests proven to come from Tent.
- Every Tent rule that proxies to Django sets the client IP and the proxy secret.
- The docs match the real topology (`access-control/game.md`, `specs/access-statistics/access-and-security.md`, `shared-infrastructure.md`).
- After deploy, a manual production check confirms the fix (see Solution).

This does not block the statistics implementation. Until it is fixed, the statistics pages treat stored IPs as best effort.

## Solution
**Shared-secret header (trust gate, no rejection)**
- New env var (e.g. `PROXY_SECRET`), set on both Tent and Django. Follow the existing `X-Statistics-Skip-Secret` / `STATISTICS_SKIP_SECRET` pattern: compare with `secrets.compare_digest`, and an empty secret means "not configured".
- Tent: on every rule that proxies to Django (`backend.php`, `private_game_data_cache.php`, `admin.php`, `redirects.php`, prod and dev), wire `SetClientIpMiddleware` and send the secret header. Tent must also strip any client-supplied copy of that header.
- Django: when the request carries a valid secret, take the client IP from `X-Forwarded-For`. Split on commas and use the leftmost entry, which is the one Tent set; Render may append hops after it. Otherwise, ignore `X-Forwarded-For` and use `REMOTE_ADDR`. Requests without the secret are **not rejected**, so health checks and other direct callers keep working; their forged header is just ignored.
- Extract the IP resolution into one reusable helper, used by `StatisticsSessionMiddleware`. Make sure the stored value is always a single valid IP.

**Edge proxy in front of Tent: unknown**
- This issue assumes clients connect straight to Tent. If the post-deploy check shows a CDN/edge in front of Tent (Tent's `REMOTE_ADDR` being an edge IP), open a follow-up issue to restore the real IP from the edge's header, trusted only from the edge's ranges.

**Docs**
- Fix `access-control/game.md` (Django is publicly reachable; trust comes from the proxy secret), `specs/access-statistics/access-and-security.md` and `shared-infrastructure.md`, and the `USE_X_FORWARDED_HOST` note in `settings.py`.
- Document the new env var wherever deploy env vars are documented.

**Manual post-deploy check (owner)**
- Through Tent, with a forged `X-Forwarded-For`, the stored session IP is the real client IP.
- Directly to the Render backend host, with a forged `X-Forwarded-For`, the stored IP is the connecting peer (`REMOTE_ADDR`), not the forged value.
- Compare Tent's `REMOTE_ADDR` with the real client IP to detect an edge proxy.

## Benefits
- Statistics (sessions, visits, unique-visitor counts) reflect real client IPs.
- Session reuse based on IP can't be manipulated.
- The access-control docs describe the real topology, so future security reasoning relies on correct premises.
