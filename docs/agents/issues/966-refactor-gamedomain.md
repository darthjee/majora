# Issue: Refactor GameDomain

## Description

`GameDomain` rows currently allow the same `domain` string to repeat across different
`GameDomainGroup`s, as long as they're not the same group. We want to add a custom `title`
field to `GameDomain`, but the duplicate-domain-name allowance means the title would need to
be kept in sync across every duplicate row for the same domain — this issue removes that
duplication path and, along the way, unlocks per-game domain-group visibility control. Any
further per-domain fields beyond `title` are out of scope here and left for future issues.

## Problem

- `GameDomain`'s uniqueness constraint is `(domain, game_domain_group)`, not `domain` alone, so
  the same hostname can legitimately appear on multiple `GameDomain` rows (one per group).
- Adding a custom-title field to `GameDomain` on top of that would mean the same domain's title
  could drift across its duplicate rows.
- Today, `Game.game_domain_group` is a nullable singular `ForeignKey` — a game can only ever
  belong to zero or one `GameDomainGroup`, so there's no way to have a game appear across
  several domains/groups while restricting others to just one.

## Expected Behavior

- Every `GameDomain.domain` value is globally unique — no more duplicate hostnames across
  groups.
- A `Game` can be linked to multiple `GameDomainGroup`s, so it can appear under multiple
  domains.
- A `Game` linked to zero groups stays invisible on every domain (same as today's `null` FK) —
  there's no implicit "empty groups = global" behavior.
- `GameDomain` gains the custom `title` field motivating this refactor (backend only — no
  frontend wiring in this issue).
- Staff can conveniently manage a game's domain-group links from Django admin.

## Solution

- `GameDomain` keeps its existing singular `ForeignKey` to `GameDomainGroup` (unchanged).
  Change its uniqueness constraint from `(domain, game_domain_group)` to `domain` alone. No
  special data migration needed — every `GameDomainGroup` currently has a single `GameDomain`
  and they're all already distinct.
- Replace `Game.game_domain_group` (nullable `ForeignKey`) with a `ManyToManyField` to
  `GameDomainGroup` (e.g. `game_domain_groups`). The FK→M2M conversion is a mechanical data
  migration: each game with a non-null group gets exactly one M2M row, games with a null group
  keep zero rows.
- Update `backend/games/caches/domain_games_cache.py::DomainGamesCache._query`, which currently
  does:
  ```python
  Game.objects.filter(game_domain_group=game_domain.game_domain_group)
  ```
  to filter through the new M2M field instead (e.g.
  `Game.objects.filter(game_domain_groups=game_domain.game_domain_group)`) — still resolving
  against a single `GameDomainGroup`, since `GameDomain`'s side of the relationship isn't
  changing.
- Add the custom `title` field to `GameDomain`, backend only (model + migration); frontend
  wiring is a follow-up issue.
- Add `filter_horizontal = ('game_domain_groups',)` to `GameAdmin` in `backend/games/admin.py`
  so the new M2M gets Django's searchable dual-list widget instead of the default multi-select
  box.

## Benefits

- Removes the duplication risk that blocked adding a custom-title field to `GameDomain`.
- Enables games to be shared across multiple domains/groups, or restricted to specific ones — a
  capability that doesn't exist today.
- Keeps the domain→group lookup simple and unambiguous for the CSRF/game-resolution code paths
  that depend on it.
