# Cache Plan: endpoint /games.json is adding x-skip-cache true

Main plan: [plan.md](plan.md)

## Shared contracts

- After [backend.md](backend.md) and [proxy.md](proxy.md) land, the per-domain
  `GET /games.json` response is cacheable (domain-partitioned), where before it was
  always `X-Skip-Cache: true`. This doc update only needs to describe that state
  accurately — no `navi/` config change is in scope (see Notes).

## Implementation Steps

### Step 1 — Update the "restricted endpoint" framing for `/games.json`

`docs/agents/cache-warmer.md`'s "Maintaining this configuration" section currently says:

> Never include restricted endpoints (cross-check `docs/agents/access-control/`) —
> except when the same URL serves both a regular and a restricted form (e.g.
> `/games.json`), in which case the regular form is included as usual.

This used `/games.json` as the canonical example of a restricted form that's excluded
from the warm-up chain. That's still accurate today — the per-domain form is still not
in the Navi warm-up chain (that's a separate, explicitly out-of-scope effort per the
issue) — but the reason it was restricted (unconditional `X-Skip-Cache`) no longer
applies to `GET`; it's excluded now because Navi has no multi-domain
`clients:`/resource config to warm it, not because the response can't be cached at all.
Reword the parenthetical so it doesn't imply the per-domain `GET` form is still
uncacheable-by-design — e.g. note that it's cacheable (domain-partitioned by the proxy)
but still excluded from Navi's warm-up chain pending multi-domain client config.

## Files to Change

- `docs/agents/cache-warmer.md` — reword the `/games.json` restricted-endpoint example
  in "Maintaining this configuration" to reflect that the per-domain form is now
  cacheable, just not yet warmed by Navi.

## Notes

- Actually adding Navi warm-up support for the per-domain domains
  (`$gamesJsonCacheDomains`) is explicitly **out of scope** for this issue — the
  reporter is handling that separately, in parallel. Do not add `navi/` config changes
  as part of this plan.
