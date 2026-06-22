# Plan: Add edit PC page (issue #110)

## Summary

Add an edit page for player characters at `/#/games/:game_slug/pcs/:id/edit`, mirroring the
existing show page, but rendering a form for `name`, `avatar_url`, `character_class`, `level`,
and `description`. Only the connected player or a superuser may edit. Field restrictions and
validation are enforced on the backend, not just hidden in the frontend. An "Edit" button is
shown on the show page when the logged-in user is allowed to edit, reacting live to login state.

## Architecture gap found during exploration

There is currently **no link between Django's `User` model and the `Player` model** —
`Player` (`source/games/models.py:35`) has no FK to `User`, and the registration flow
(`source/games/views/auth.py:101`) only creates a `User`, never a `Player`. To know "the
player connected with the character", the backend needs `Player.user`. This plan adds a
nullable `user` FK to `Player`; assigning an existing `Player` to a `User` remains a manual
step via the existing Django admin (already registered, no admin changes needed since admin
shows all model fields by default). Building an invite/claim flow is out of scope for this issue.

## Agents involved

- **backend** — `Player.user` FK + migration, `can_edit` on the PC detail serializer, PATCH
  support on the PC detail endpoint with permission + validation, `user_id` on the status
  endpoint, tests.
- **frontend** — Edit button on the show page reacting to auth state, new edit page/route,
  form with per-field error display, redirect-on-unauthorized, tests.
- **translator** — new i18n keys for the edit page, in both `en.yaml` and `pt.yaml`.

## Shared contracts

### `GET /games/<game_slug>/pcs/<id>.json` (existing endpoint, extended)

Response gains one field:

```json
{ "...existing fields...": "...", "can_edit": false }
```

`can_edit` is `true` only when the request is authenticated (via `Authorization: Token <token>`
header — optional, the endpoint stays publicly readable) **and** the user is either a
superuser or the `User` linked to the character's `player`. Frontend must send the
`Authorization` header on this GET when a token is present in `AuthStorage`, otherwise
`can_edit` is always `false`.

### `PATCH /games/<game_slug>/pcs/<id>.json` (new method on the existing endpoint)

Request requires `Authorization: Token <token>`. Body — only these keys are accepted:

```json
{ "name": "...", "avatar_url": "...", "character_class": "...", "level": 5, "description": "..." }
```

All keys optional (partial update); any other key is ignored server-side (never written, even
if present in the payload).

Responses:
- `401` — no/invalid token: `{ "errors": { "detail": ["authentication required"] } }`
- `403` — authenticated but not the connected player nor a superuser:
  `{ "errors": { "detail": ["not allowed to edit this character"] } }`
- `400` — validation failure, payload **not persisted**:
  `{ "errors": { "<field_name>": ["error1", "..."] } }` (DRF's native per-field serializer
  error shape, wrapped under a top-level `errors` key)
- `200` — success: same body shape as the `GET` detail response (including `can_edit`).

### `GET /users/status.json` (existing endpoint, extended)

Response gains `user_id` (the authenticated `User`'s pk, `null` when `logged_in` is `false`),
so the frontend can know who is logged in without needing it for the PC permission check itself
(permission is decided server-side via `can_edit`) — kept for completeness/future use by other
pages, but not required for this issue's own minimum viable flow since `can_edit` already
carries the permission decision.

### Frontend route

New hash route `/games/:game_slug/pcs/:character_id/edit` → page key `pcCharacterEdit`.

## CI checks

- Backend: `docker-compose run --rm majora_tests pytest source/games` and
  `docker-compose run --rm majora_be ruff check source/`.
- Frontend: `docker-compose run --rm majora_fe yarn lint` and
  `docker-compose run --rm majora_fe yarn test`.
- Translator: existing i18n key-sync check script (see `docs/agents/i18n.md`) must pass with
  the new keys present in both `en.yaml` and `pt.yaml`.

See [backend.md](backend.md), [frontend.md](frontend.md), and [translator.md](translator.md)
for the per-agent breakdown.
