# Frontend Plan: Dev stack: local frontend at localhost:3000 renders a blank page

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend `GET /games.json` 404 body: `{"errors": {"detail": ["domain_not_recognized"]}}`.
- Translation keys (added by the translator, read with `Translator.t`):
  `error_boundary.title`, `error_boundary.message`, `error_boundary.reload`,
  `games_page.domain_not_recognized`.

## Steps

- [01 — Keep the HTTP status and body on rejected requests](frontend/01-http-error-with-status-and-body.md)
- [02 — Games list warning for `domain_not_recognized`](frontend/02-games-list-domain-warning.md)
- [03 — App-wide error boundary](frontend/03-app-error-boundary.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` and the Jasmine suite (CI jobs:
  `jasmine`, `frontend-checks`).

## Notes

- Reading the code, `ListPageController` already catches a rejected fetch and shows "Unable to
  load list.", so the 404 alone may not be what blanks the page; the real render error is
  unconfirmed. The error boundary (step 03) guarantees a fallback whatever the cause, and the
  user confirms the actual root cause manually in the browser after the merge (per the issue).
  If, while implementing, a concrete render crash on the home/games path becomes evident (e.g.
  something reading `pagination`/`data` from a failed response), fix it too and mention it in
  the PR.
