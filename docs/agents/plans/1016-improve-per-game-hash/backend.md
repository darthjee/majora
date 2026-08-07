# Backend Plan: Improve per game hash

Main plan: [plan.md](plan.md)

## Shared contracts

- Removing `ENABLE_GAMES_PER_DOMAIN` is safe to do unconditionally — the
  proxy's own removal of `$gamesJsonPerDomainCaching` is handled independently
  by the `proxy` agent, not something this side needs to wait on or call.
- Preserve the existing safety net exactly: an unrecognized `Host` (not in
  `RegisteredDomainsCache.domains()`) must keep returning 404 with
  `X-Skip-Cache: true`. The proxy's cache handler relies on that header to
  avoid ever writing a cache entry for a spoofed domain — the only thing
  guarding against unbounded per-domain cache-folder growth now that the
  feature flag is gone.

## Implementation Steps

### Step 1 — Remove the setting

Remove `ENABLE_GAMES_PER_DOMAIN` from `backend/majora_project/settings.py`
(currently line 30, right after the `USE_X_FORWARDED_HOST` comment block —
update that comment if it references the flag).

### Step 2 — Collapse `games_list.py` to the always-per-domain path

In `backend/games/views/games/games_list.py`:
- Remove the `if not settings.ENABLE_GAMES_PER_DOMAIN: ...` branch from
  `games_list()` — every request now takes what `_games_list_per_domain()`
  currently does.
- Fold `_games_list_per_domain()`'s body directly into `games_list()` (it's
  no longer a secondary path gated behind a flag, so the separate
  `_games_list_per_domain` name/indirection no longer earns its keep) — or
  keep it as a private helper if that reads better; either is fine as long as
  the flag-check and the flat/unscoped listing branch it guarded are both
  gone.
- `_create_game`'s `domain=None` default and its "when `domain` is given"
  branch stay — every call site now passes `domain=host`, but the parameter
  itself doesn't need to change.

### Step 3 — Update `games_list_test.py`

This is the step with a real behavioral consequence, not just a mechanical
rename — read carefully:

- **Delete `TestGamesListViewDomainFlagOff`** entirely — it specifically
  tests the flat/unscoped listing behavior (`ENABLE_GAMES_PER_DOMAIN` left at
  its default "off"), which no longer exists.
- **Drop `ENABLE_GAMES_PER_DOMAIN=True` from every remaining
  `@override_settings(...)` decorator** in `TestGamesListViewPerDomainGet`
  and `TestGamesListViewPerDomainPost` — keep `ALLOWED_HOSTS=['*']` (still
  needed to accept the custom `HTTP_HOST` values these tests send), just drop
  the setting that no longer exists.
- **`TestGamesListView` and `TestGamesCreateView` (top of the file) will
  break** once the flat path is gone, because they call `client.get('/games.json')`
  /`client.post('/games.json')` with no `HTTP_HOST` override — Django's test
  client defaults to `Host: testserver`, which isn't a domain in
  `RegisteredDomainsCache` (no `GameDomain` row for it), so every one of
  those requests would now 404 instead of exercising the listing/creation
  logic. These games were also created without any `game_domain_groups`, so
  even a registered `testserver` domain would resolve to an empty list via
  `DomainGamesCache.game_ids_for_domain`, not "every game" like the tests
  currently assert.
  - Fix by giving each of these test classes a registered domain to operate
    against: add a `GameDomainFactory(domain='testserver')`-equivalent setup
    (matching Django's default test `Host`, so no `HTTP_HOST=`/`ALLOWED_HOSTS`
    override is needed), and attach the `GameFactory`-created games to that
    domain's `game_domain_group` so the existing "returns all created games"
    assertions still hold true under domain-scoped resolution.
  - `test_post_creates_dm_player_for_creator` and friends in
    `TestGamesCreateView` don't need a domain *group* attachment for existing
    assertions to hold, but the POST itself now runs through
    `_create_game(request, domain=host)`, which does
    `GameDomain.objects.get(domain=domain)` — that lookup will raise
    `DoesNotExist` unless a matching `GameDomain` row exists for whatever
    `Host` the test client sends. So this domain registration is required for
    `TestGamesCreateView` to keep passing at all, not just for correctness of
    its assertions.
  - Consider whether `TestGamesListView`/`TestGamesCreateView` are still
    worth keeping distinct from `TestGamesListViewPerDomainGet`/
    `...PerDomainPost` once both exercise the same domain-scoped code path —
    could fold together, but that's a judgment call for whoever implements
    this; not required by the issue.

## Files to Change

- `backend/majora_project/settings.py` — remove `ENABLE_GAMES_PER_DOMAIN` (Step 1)
- `backend/games/views/games/games_list.py` — collapse to always-per-domain (Step 2)
- `backend/games/tests/views/games/games_list_test.py` — remove flag-off
  class, drop `ENABLE_GAMES_PER_DOMAIN` from decorators, fix
  `TestGamesListView`/`TestGamesCreateView` to register a domain (Step 3)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/` from `backend/` (CI job:
  `pytest_views_rest`, excludes `games/tests/views/game/` — covers
  `games/tests/views/games/games_list_test.py`)

## Notes

- `RegisteredDomainsCache`/`DomainGamesCache` and the `X-Skip-Cache`
  unrecognized-domain safety net are unchanged by this issue — see the main
  plan's Shared contracts. Don't touch that wiring while collapsing the
  flag-gated branch.
