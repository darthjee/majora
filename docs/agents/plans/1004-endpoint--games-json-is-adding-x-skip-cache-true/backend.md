# Backend Plan: endpoint /games.json is adding x-skip-cache true

Main plan: [plan.md](plan.md)

## Shared contracts

- After this change, a successful `GET /games.json` response in per-domain mode
  (recognized host) no longer carries `X-Skip-Cache`. The 404 (unrecognized host) and
  `POST` responses keep `X-Skip-Cache: true` — unchanged. The proxy relies on this: its
  `default_proxy` handler already treats the header's absence as "cacheable".

## Implementation Steps

### Step 1 — Stop setting `X-Skip-Cache` on the successful GET response

In `backend/games/views/games/games_list.py`, `_games_list_per_domain` currently sets
`response['X-Skip-Cache'] = 'true'` unconditionally after both the `POST` and `GET`
branches (line 46, after the `if/else`). Split it so only the paths that must stay
uncached set it:

```python
def _games_list_per_domain(request):
    """Handle GET/POST once `ENABLE_GAMES_PER_DOMAIN` is on, scoping both to the host."""
    host = request.get_host().split(':')[0].lower()
    if host not in RegisteredDomainsCache.domains():
        response = Response(UNRECOGNIZED_DOMAIN_RESPONSE_DATA, status=404)
        response['X-Skip-Cache'] = 'true'
        return response

    if request.method == 'POST':
        response = _create_game(request, domain=host)
        response['X-Skip-Cache'] = 'true'
    else:
        games = Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))
        response = paginated_list_response(request, games, GameListSerializer)
    return response
```

(The 404 branch already returns early with its own `X-Skip-Cache` set, so it's
unaffected — just make sure the trailing `response['X-Skip-Cache'] = 'true'` line that
used to run for every path only runs for the `POST` branch now.)

### Step 2 — Update the existing test that asserts the opposite behavior

`backend/games/tests/views/games/games_list_test.py`,
`TestGamesListViewPerDomainGet.test_recognized_domain_response_sets_skip_cache_header`
(around line 231) currently asserts `response['X-Skip-Cache'] == 'true'` for a
successful `GET`. Flip it to assert the header is now absent, and rename it to match:

```python
@override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
def test_recognized_domain_response_does_not_set_skip_cache_header(self, client):
    """Test that a successful GET on a recognized domain does NOT set X-Skip-Cache."""
    response = client.get('/games.json', HTTP_HOST='tenant.example.com')
    assert 'X-Skip-Cache' not in response
```

Leave the following tests exactly as they are — they cover the paths that keep the
header:
- `TestGamesListViewPerDomainGet.test_unrecognized_domain_response_sets_skip_cache_header`
  (404 path, line ~237)
- `TestGamesListViewPerDomainPost.test_recognized_domain_response_sets_skip_cache_header`
  (`POST` path, line ~289)

Also leave `TestGamesListViewDomainFlagOff.test_does_not_set_skip_cache_header` (line
~181) untouched — it already covers the non-per-domain path and is unaffected by this
change.

## Files to Change

- `backend/games/views/games/games_list.py` — only set `X-Skip-Cache: true` on the
  `POST` branch of `_games_list_per_domain`, not the `GET` branch.
- `backend/games/tests/views/games/games_list_test.py` — flip
  `test_recognized_domain_response_sets_skip_cache_header` (in
  `TestGamesListViewPerDomainGet`) to assert the header's absence.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/`
  (CI job: `pytest_views_rest`) — `games/tests/views/games/games_list_test.py` falls
  under this job (note: `games/tests/views/game/`, singular, is a different directory
  excluded by this job and covered by `pytest_views_characters` instead — this file
  isn't in it).

## Notes

- No serializer, model, or permission changes — this is purely about which branch sets
  a response header. `docs/agents/access-control/game.md` also needs updating, but that
  edit is handled by the architect directly (see main `plan.md`), not by this agent,
  since it's outside `backend/`.
