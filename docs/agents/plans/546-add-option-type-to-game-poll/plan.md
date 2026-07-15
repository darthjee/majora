# Plan: Add option type to Game Poll

Issue: [546-add-option-type-to-game-poll.md](../issues/546-add-option-type-to-game-poll.md)

## Overview

Add an `option_type` attribute to `Poll` (`text` default, `date`), set once per poll and applied
to all of its options. The New Poll form gains a select for it after Description. Both the New
Poll form's option inputs and the Poll page's option display switch rendering based on
`option_type` through a shared pair of extensible, type-aware components (native date picker for
`date`, plain text otherwise), so future option types can be added by extending those components
rather than branching ad hoc.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **Field name**: `option_type`, a `Poll`-level `CharField` (not per-`PollOption`) with choices
  `'text'` (default) and `'date'`, `max_length=16`, following the existing
  `Poll.TYPE_CHOICES`/`Poll.STATUS_CHOICES` constant pattern (`Poll.OPTION_TYPE_TEXT`,
  `Poll.OPTION_TYPE_DATE`, `Poll.OPTION_TYPE_CHOICES`).
- **API surface** (`POST /games/<slug>/polls.json`, `GET /games/<slug>/polls/<id>.json`):
  - Request body for poll creation accepts an optional top-level `option_type` string
    (`'text'` or `'date'`), defaulting server-side to `'text'` when omitted.
  - Both the create response (201) and the detail response include `option_type` as a top-level
    field on the poll object, sibling to `type` and `status` (not nested inside individual
    `options` entries — the type applies to the whole poll).
  - `PollListSerializer` is unaffected — it does not need `option_type` since the polls list page
    does not render options.
- **Frontend consumption**: `GamePollNew.jsx`/`GamePollNewHelper.jsx` send `option_type` in the
  `createPoll` payload and use it to pick each option input's widget; `GamePoll.jsx`/
  `GamePollHelper.jsx` read `poll.option_type` from the fetched detail to pick each option's
  display format. Both consume the same pair of type-aware components (see frontend plan).
- **Translation keys**: `game_poll_new_page.option_type_label`, `option_type_text`,
  `option_type_date` (translator plan) — used by both the New Poll form's select and, where
  needed, by the type-aware components for accessible labelling.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `games/tests/views/polls/`.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `games/tests/models/poll/`.
- `frontend`: `npm test` (CI job: `jasmine`) and `npm run lint` (CI job: `Check JS Lint`).
