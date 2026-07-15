# Plan: Add session pool

Issue: [279-add-session-pool.md](../issues/279-add-session-pool.md)

## Overview

Let a DM start a "pick our next session date" poll directly from an unscheduled game session
page. Adds a nullable, polymorphic relationship on `Poll` (via Django's `GenericForeignKey`,
mirroring the existing `Link` model) so a poll can optionally be attached to a `GameSession`
today and to other entity types later, plus a new session-scoped creation endpoint and a
DM-only "Create Pool" modal on the frontend. Depends on issue #546 (`Poll.option_type`) being
implemented first — this plan assumes that field and its date-aware frontend components already
exist.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Product review notes (from product-owner agent, read before finalizing this plan)

- **Deliberate UI/API gating split**: the existing poll-creation precedent (`GamePollNewController`)
  gates its UI identically to the API (DM+player+admin both places). This plan intentionally
  diverges: the "Create Pool" button is DM-only (`session.can_edit`), while the endpoint itself
  stays open to DM+player+admin via `PollPermission`, matching the issue's explicit permission
  list. This is a legitimate UX choice (backend remains the source of truth), not an oversight —
  called out here so it isn't "fixed" to match the old precedent during review.
- **Guardrail — do not leak poll content via the public session endpoint**: `GameSession`'s GET
  detail view is `AllowAny` (public/unauthenticated), while `Poll` data is always
  game-scoped-gated. `GameSessionDetailSerializer` must **not** be changed to embed the linked
  poll's title/options/id — poll data stays reachable only through the separately-gated Poll
  endpoints. The new session-poll-create endpoint follows the `session_messages_list` precedent
  (`@permission_classes([AllowAny])` at the DRF level, with `PollPermission.check(request, game)`
  enforced inline) — the `AllowAny` decorator alone is not the guardrail, the inline check is.

## Shared contracts

- **Model**: `Poll` gains `content_type` (`ForeignKey(ContentType, on_delete=CASCADE, null=True,
  blank=True)`), `object_id` (`PositiveIntegerField(null=True, blank=True)`), and `content_object`
  (`GenericForeignKey('content_type', 'object_id')`) — field names and nullability copied
  verbatim from the existing `Link` model (`backend/games/models/link.py`). No backfill migration
  needed (unlike `Link`'s), since `Poll` never had a typed relation to migrate from — existing
  polls simply get `content_type=None, object_id=None`.
- **New endpoint**: `POST /games/<slug:game_slug>/sessions/<int:session_id>/poll.json`.
  - Request body: `{"dates": ["YYYY-MM-DD", ...]}` — 1 to 50 dates (same bound as the general
    poll options list).
  - Permission: identical to the existing poll endpoints — game's DM(s), players, and
    admins/superuser/staff (reuses `PollPermission.check(request, game)` unchanged).
  - On success: `201` with the same shape `PollDetailSerializer` already returns (`id, title,
    description, type, status, option_type, options`) — the frontend redirects to
    `/#/games/<slug>/polls/<id>` afterward, exactly like the general New Poll form does.
  - Server fills in: `option_type=Poll.OPTION_TYPE_DATE`, `type=Poll.TYPE_SINGLE`,
    `status=Poll.STATUS_OPEN`, a fixed default title, no description, `content_object=session`,
    and one `PollOption` per submitted date (`option=<date>.isoformat()`, in submission order).
- **Frontend consumption**: the "Create Pool" button and modal live on the session page
  (`GameSession.jsx`/`GameSessionHelper.jsx`), reusing `PollOptionInput` (from #546,
  `option_type='date'`) for each date row, and a new `GameSessionClient#createSessionPoll`
  method for the POST.
- **Translation keys** (translator plan): `game_session_page.create_pool`, plus a
  `session_poll_modal.*` block (`title`, `dates_label`, `confirm`, `cancel`, `error`).

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `games/tests/views/game_sessions/`.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `games/tests/models/poll/`.
- `frontend`: `npm test` (CI job: `jasmine`) and `npm run lint` (CI job: `Check JS Lint`).

## Notes

- Hard dependency on #546: `Poll.option_type`, `Poll.OPTION_TYPE_DATE`, and the frontend
  `PollOptionInput`/`PollOptionValue` components must exist before this plan's steps can be
  implemented. If #546 hasn't merged yet, this branch should rebase onto it first.
- Applying the poll's winning date back onto `GameSession.date` is explicitly out of scope
  (confirmed with the user) — left for a future issue.
