# Backend Plan: Scoped API tokens: scope declarations for sessions and polls

Main plan: [plan.md](plan.md)

## Overview

Add `@token_scopes` declarations to every session/poll view, drop them from
`PENDING_TOKEN_SCOPES`, and add tests following the sibling pattern (#1634, #1635, #1630).

## Context

- Rules: `docs/agents/access-control/token-scopes.md` (the issue links
  `docs/agents/specs/client/scopes.md`, which was removed in #1613; the rules now live in the
  access-control doc).
- Catalogue `backend/accounts/scopes.py` already has the `sessions` and `polls` families.
- Decorator `backend/games/decorators.py` (`token_scopes(**methods)`), enforcement in
  `backend/accounts/authentication.py` (`TokenScopeCheck`).
- No session/poll serializer embeds another family, so every declaration stays within its own
  family. `sessions/<id>/poll.json` needs only `polls:write` (the session is public data).

## Declarations

| View (URL name) | Declaration |
|---|---|
| `game_sessions_list` (`game-sessions-list`) | `GET=[], POST=['sessions:write']` |
| `game_sessions_past` (`game-sessions-past`) | `GET=[]` |
| `game_sessions_future` (`game-sessions-future`) | `GET=[]` |
| `game_sessions_unscheduled` (`game-sessions-unscheduled`) | `GET=[]` |
| `game_session_detail` (`game-session-detail`) | `GET=[], PATCH=['sessions:write']` |
| `session_messages_list` (`session-messages-list`) | `GET=['sessions:read'], POST=['sessions:write']` |
| `session_poll_create` (`game-session-poll-create`) | `POST=['polls:write']` |
| `game_polls_list` (`game-polls-list`) | `GET=['polls:read'], POST=['polls:write']` |
| `game_poll_detail` (`game-poll-detail`) | `GET=['polls:read']` |
| `game_poll_votes` (`game-poll-votes`) | `GET=['polls:read'], PUT=['polls:write']` |
| `game_poll_close` (`game-poll-close`) | `PATCH=['polls:write']` |

## Steps

- [01 — Declare scopes on session and poll views](backend/01-declare-scopes.md)
- [02 — Remove entries from the pending list](backend/02-pending-list.md)
- [03 — Add sessions token-scope tests](backend/03-sessions-tests.md)
- [04 — Add polls token-scope tests](backend/04-polls-tests.md)
- [05 — Update the token-scopes doc](backend/05-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game_sessions games/tests/views/polls accounts/tests/token_scopes_coverage_test.py`
  (CI jobs: `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- This is not the last #1603 sub-issue: the pending set must stay (treasures, miniatures,
  game photos, permissions views, upload finalize remain).
- Existing inline `X-Skip-Cache` behaviour on poll/message views must not change.
- Session login and legacy `Token` behaviour must not change.
