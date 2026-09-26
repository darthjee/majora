# Add the session search endpoint

`games/<slug:game_slug>/sessions.json` is currently routed to `game_sessions_create`, which only handles `POST`. Make it `@api_view(['GET', 'POST'])` and dispatch `GET` to a new `_search_sessions(request, game)`. Alternatively, rename the view to `game_sessions_list` and keep the old name as an alias. Pick whichever matches `game_tasks_list`'s GET/POST pattern best, but keep the URL name `game-sessions-list`.

`GET` behavior:
- Public (`AllowAny`, no `EndpointPermission` check), like `past`/`future`/`unscheduled`. `POST` keeps its current inline `EndpointPermission` edit check.
- Queryset: `game.sessions`, filtered with `common.query_filters.filter_by_name(request, qs, field='title')`, ordered most recent first: `order_by(F('date').desc(nulls_last=True), '-id')`.
- Paginate with `paginated_list_response` using a new `GameSessionPickSerializer` (`id`, `title`, `date`, plus `name = CharField(source='title', read_only=True)`), because `ResourcePickerSearch` renders `item.name`. Don't add `name` to `GameSessionListSerializer`: that would change the cached past/future/unscheduled payloads.

Tests: returns all of the game's sessions and not other games' sessions; `name` filter is case-insensitive substring on title; `per_page=5` caps results; ordering; anonymous access allowed; `POST` still requires edit permission.

## Files to Change
- `backend/games/views/game_sessions/game_sessions_create.py` (or a renamed `game_sessions_list.py`) — add `GET` handling.
- `backend/games/views/game_sessions/__init__.py` / `backend/games/urls/games.py` — only if the view is renamed.
- `backend/games/serializers/games/sessions/game_session_pick.py` — new serializer, exported from the serializers package.
- `backend/games/tests/...game_sessions...` — search specs.
