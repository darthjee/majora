# Update access-control docs

Document the new public `GET /games/:game_slug/sessions.json` (search by `name`, fields `id`, `name`, `title`, `date`) in the game-session access-control doc and the endpoints index. In the task doc, document the nested `session: {id, title}` payload and the `session=<id>|none` filter. A session title is already public through the other session list endpoints, so exposing it on DM-only task payloads is not a new leak.

## Files to Change
- `docs/agents/access-control/game-session.md` — new `GET` on `sessions.json`.
- `docs/agents/access-control/endpoints.md` — list the new `GET`.
- `docs/agents/access-control/task.md` — nested `session` field and `session` filter.
