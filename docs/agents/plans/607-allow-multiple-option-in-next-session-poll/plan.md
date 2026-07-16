# Plan: Allow multiple option in next session poll

Issue: [607-allow-multiple-option-in-next-session-poll.md](../issues/607-allow-multiple-option-in-next-session-poll.md)

## Overview

The session date poll creation flow (the "Create Pool" modal on a game session page) always creates the poll as single-choice, with no UI to change it, even though the generic poll form and the underlying voting mechanics already fully support multiple-choice polls. This plan adds a single/multiple type selector to the session poll modal, defaulting to "multiple", and threads the chosen type through to the backend, which currently hardcodes `Poll.TYPE_SINGLE`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **API field**: `POST /games/<game_slug>/sessions/<session_id>/poll.json` gains an optional `type` field in its JSON body, alongside the existing `dates` array. Accepted values are `'single'` / `'multiple'` (`Poll.TYPE_CHOICES`). When omitted, the backend defaults it to `'multiple'` (this is a change from the current implicit `'single'`).
- **Frontend request shape**: `GameSessionClient.createSessionPoll(gameSlug, sessionId, token, dates, type)` posts `{ dates, type }` instead of the current `{ dates }`. `type` is sourced from new local state in `CreateSessionPollModal`, threaded through `GameSession.jsx`'s `handleCreatePoll` and `GameSessionController.submitPoll`, and defaults to `'multiple'` when the modal opens.
- **i18n keys**: three new keys under the `session_poll_modal` namespace — `type_label`, `type_single`, `type_multiple` — must exist in every locale file (`en.yaml`, `pt.yaml`) before the frontend radio selector renders (mirrors the existing `game_poll_new_page.type_*` keys).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_views_rest` / `pytest_all`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` and `docker-compose run --rm majora_fe yarn lint` (CI job: `jasmine` / `frontend-checks`)
- `frontend`/`translator`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
