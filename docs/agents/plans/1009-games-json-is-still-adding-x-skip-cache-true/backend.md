# Backend Plan: /games.json is still adding x-skip-cache true

Main plan: [plan.md](plan.md)

## Shared contracts

- Remove the `GAMES_JSON_CACHE_DOMAINS` Django setting and its env var entirely — nothing else in the backend consumes it. The proxy team does not depend on this setting existing; it only needs the backend to stop advertising a sync requirement (handled in the architect's doc pass, not here).

## Implementation Steps

### Step 1 — Remove the conditional `X-Skip-Cache` on the GET branch

In `backend/games/views/games/games_list.py`, `_games_list_per_domain`:

```python
games = Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))
response = paginated_list_response(request, games, GameListSerializer)
if host not in settings.GAMES_JSON_CACHE_DOMAINS:
    response['X-Skip-Cache'] = 'true'
```

becomes:

```python
games = Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))
response = paginated_list_response(request, games, GameListSerializer)
```

**Do not touch** the unrecognized-domain `404` branch or the `POST` branch — both must keep setting `X-Skip-Cache = 'true'` unconditionally, exactly as today. This is intentional, not an oversight: see the main plan's Overview for why (Tent's shared catch-all cache in `rules/backend.php` caches any 2xx response for any HTTP method, keyed only by query string — `POST /games.json` has none, so removing the header there would let one user's game-creation response get served to every subsequent POST).

### Step 2 — Remove the now-unused setting

In `backend/majora_project/settings.py`, delete:

```python
GAMES_JSON_CACHE_DOMAINS = {
    domain for domain in os.environ.get('GAMES_JSON_CACHE_DOMAINS', '').split(',') if domain
}
```

`os` is used elsewhere in this file, so leave the `import os` in place.

### Step 3 — Update the test suite

In `backend/games/tests/views/games/games_list_test.py`, inside `TestGamesListViewPerDomainGet`:

- `test_recognized_domain_response_does_not_set_skip_cache_header` — currently overrides `GAMES_JSON_CACHE_DOMAINS={'tenant.example.com'}` to force the "does not set" branch. Since the header is now unconditionally absent on `GET`, drop that override and keep the assertion (`'X-Skip-Cache' not in response`) — this becomes the general-case test for a recognized domain's `GET`.
- `test_recognized_domain_not_cache_partitioned_still_sets_skip_cache_header` — this test asserts the header IS set when the domain isn't in `GAMES_JSON_CACHE_DOMAINS`. That behavior no longer exists (the header is never set on `GET` regardless of domain), so delete this test entirely.

Leave everything else in the file untouched, including:
- `test_does_not_set_skip_cache_header` (flag-off case) — unaffected.
- `test_unrecognized_domain_response_sets_skip_cache_header` — still correct, the 404 branch is unchanged.
- `test_recognized_domain_response_sets_skip_cache_header` (in `TestGamesListViewPerDomainPost`) — still correct, the POST branch is unchanged.

## Files to Change

- `backend/games/views/games/games_list.py` — remove the conditional `X-Skip-Cache` assignment on the GET branch.
- `backend/majora_project/settings.py` — remove the `GAMES_JSON_CACHE_DOMAINS` setting.
- `backend/games/tests/views/games/games_list_test.py` — simplify one test, delete another, per Step 3.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`)

## Notes

- No migration needed — this is a plain setting/env var removal, not a model change.
- Double-check no other file in `backend/` references `GAMES_JSON_CACHE_DOMAINS` before deleting the setting (a repo-wide grep at issue-drafting time found only `settings.py`, `games_list.py`, and `games_list_test.py` on the backend side).
