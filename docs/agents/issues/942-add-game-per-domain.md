# Issue: Add game per Domain

## Description
Majora wants to eventually support serving different sets of games per web
domain/tenant (multi-tenancy / white-labeling): different hostnames could
show different games under the same brand. This issue lays the foundational
data model for that future feature — no routing, request-time domain
resolution, serializers, or API endpoints are in scope, only the models.

## Problem
There is currently no concept of a web domain/tenant anywhere in the
codebase (checked the `proxy/` PHP layer and `product.md` — no prior art).
`Game` has no way to be associated with a hostname or a group of hostnames,
so per-domain game visibility isn't possible yet.

## Solution
Add two new models to the `games` app, plus one new optional field on `Game`:

- `GameDomainGroup` — represents a tenant/brand (a single logical entity
  reachable through multiple hostnames).
  - `name` (`CharField`) — human-readable label for the tenant/brand.
  - `HistoricalRecords` — tracked, consistent with `Game`, `Character`,
    `Treasure`, `Player`.
- `GameDomain` — represents one hostname (e.g. `foo.com`, `foo.majora.app`)
  that resolves to a `GameDomainGroup`. A group can have several
  `GameDomain`s (e.g. a custom domain and a `*.majora.app` subdomain both
  pointing at the same tenant).
  - `domain` (`CharField`, globally unique) — the full hostname, analogous
    to `Game.game_slug`.
  - `game_domain_group` (`ForeignKey` to `GameDomainGroup`, required,
    `on_delete=CASCADE`, `related_name='domains'`) — hostnames only make
    sense within a group, so deleting the group deletes its domains.
  - `HistoricalRecords` — tracked.
- `Game.game_domain_group` (`ForeignKey` to `GameDomainGroup`, optional for
  now — `null=True, blank=True`, `on_delete=SET_NULL`,
  `related_name='games'`) — deleting a group nulls out the link on any games
  that reference it rather than deleting the games. This field is expected
  to become mandatory once existing data is migrated onto a domain group, as
  a future follow-up (not part of this issue).

`GameDomainGroup` is the hub, not `GameDomain` directly: many `GameDomain`s
(hostnames) can point at the same group, and many `Game`s can belong to the
same group — the goal is that several hostnames can all serve the same set
of games (many-to-many domains-to-games, mediated by the group), rather than
a game being tied to one specific hostname.

Register both `GameDomainGroup` and `GameDomain` in `backend/games/admin.py`,
consistent with the rest of the app's models (`Game`, `Character`,
`Treasure`, `Player`, etc.).

## Benefits
Establishes the foundational data model for future multi-tenancy /
white-labeling without committing to enforcement yet, keeping the migration
low-risk since `Game.game_domain_group` starts optional.
