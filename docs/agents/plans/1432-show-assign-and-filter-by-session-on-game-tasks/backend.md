# Backend Plan: Show, assign and filter by session on game tasks

Main plan: [plan.md](plan.md)

## Shared contracts

Produces contracts 1, 2 and 3 of [plan.md](plan.md#shared-contracts):

- Task payload `session` → `{id, title}` or `null`; requests still take an id or `null`.
- `GET /games/:game_slug/tasks.json?session=<id>|none`.
- New `GET /games/:game_slug/sessions.json?name=<term>&per_page=5` returning `[{id, name, title, date}]`, public, ordered most recent first.

## Steps

- [01 — Nest the session in the task payload](backend/01-nest-session-in-task-payload.md)
- [02 — Filter the tasks list by session](backend/02-filter-tasks-by-session.md)
- [03 — Add the session search endpoint](backend/03-add-session-search-endpoint.md)
- [04 — Update access-control docs](backend/04-update-access-control-docs.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: backend tests)
- `backend`: the backend lint job (flake8/pylint via `majora_tests`, as run in CI)

## Notes
- `GameTaskCreateSerializer` / `GameTaskUpdateSerializer` keep `session` as `PrimaryKeyRelatedField`; only the read serializer (`GameTaskListSerializer`, also used for create/update responses) changes.
- Use `select_related('session')` on the tasks list queryset to avoid N+1 queries.
