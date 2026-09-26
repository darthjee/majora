# Frontend Plan: Show, assign and filter by session on game tasks

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on contracts 1–3 of [plan.md](plan.md#shared-contracts), and produces contract 4:

- `task.session` is `{id, title}` or `null`. Send `session` as an id or `null` on `POST`/`PATCH`.
- Tasks list query param `session`: `<id>` | `none` | omitted.
- `GET /games/:game_slug/sessions.json?name=<term>&per_page=5` → `[{id, name, title, date}]`.
- Translation keys in contract 5 are added by the `translator` agent. Use exactly those names.

## Steps

- [01 — Extend the resource picker (params + clear)](frontend/01-extend-resource-picker.md)
- [02 — Session request config and picker helpers](frontend/02-session-request-config.md)
- [03 — Show the session in the list and detail modal](frontend/03-show-session.md)
- [04 — Session field in create and edit forms](frontend/04-session-field-in-forms.md)
- [05 — Session filter in TaskFilters](frontend/05-session-filter.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend Jasmine specs)

## Notes
- `SingleResourcePickerField` is shared: collections and task categories use it too. Both extensions (`picker.params`, `onClear`) must be optional and backward compatible.
- The Session filter's "specific session" state needs the session title to show the picked badge after a deep-link reload. Fetch it with the existing `session` `GET.single` config (`/games/:game_slug/sessions/:id.json`, public).
