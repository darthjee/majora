# Plan: Add poll closing button

Issue: [557-add-poll-closing-button.md](../issues/557-add-poll-closing-button.md)

## Overview

Add a DM/admin-only "close poll" flow to the game poll detail page
(`/#/games/:game_slug/polls/:id`): a button opens a confirmation modal (with an
"Override Decision" switch) that either auto-picks the highest-voted option
(first by id on a tie) or lets the DM/admin pick one explicitly, then submits
to a new `PATCH .../polls/:id/close.json` endpoint. Closing marks a
`PollOption.selected` field, sets the poll's status to `closed`, blocks
further votes, and the winning option stays visibly marked afterward.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoint

- `PATCH games/<slug:game_slug>/polls/<int:poll_id>/close.json` (url name
  `game-poll-close`), same file/url family as the existing
  `games/<slug>/polls/<id>.json` and `.../votes.json` routes.
- Auth: `CookieTokenAuthentication`; permission is **DM or superuser only**
  (mirrors `Game.can_be_edited_by` — `is_superuser`, not `is_staff`; **not**
  a plain player, unlike voting/viewing which also allow players).
- Request body:
  - `{}` (empty) — server auto-picks the winner: highest vote count, first by
    `id` on a tie.
  - `{"option_id": <int>}` — explicit winner chosen via "Override Decision".
- Responses:
  - `200` — the poll detail payload (`PollDetailSerializer` shape), with
    `status: "closed"` and the winning option's `selected: true`.
  - `401` unauthenticated / `403` not DM or superuser (same error shape as
    `PollPermission`: `{"errors": {"detail": [...]}}`).
  - `400` if the poll's status isn't currently `open` (already closed, or
    still inactive) — nothing is changed.
  - `400` if `option_id` doesn't belong to the poll's options.

### Data model

- New `PollOption.selected` `BooleanField(default=False)` — set `True` on the
  winning option when its poll is closed. `PollOptionSerializer` exposes it
  (read-only) so the frontend can mark the winner after the fact, both in the
  close-confirmation flow and afterwards on the poll detail page.
- Poll status transitions to `Poll.STATUS_CLOSED` on a successful close.

### Vote-casting guard (pre-existing gap, closed by this issue)

- `PUT games/<slug>/polls/<id>/votes.json` currently has no status check at
  all. Add one: reject with `400` and an error body once
  `poll.status != Poll.STATUS_OPEN`, so voting actually stops once a poll is
  closed (or hasn't opened yet).

### Frontend access rule

- "Can close" = `access.is_dm || access.is_superuser` (from
  `AccessStore`/`GamePollController`'s existing `access` shape) — same
  DM-or-superuser rule as the backend permission, deliberately narrower than
  `#canVote` (`is_dm || is_player`) and `#isAllowed` (which also allows
  `is_staff`).

### i18n namespace

- New keys live under the existing `game_poll_page` namespace in both
  `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` — see
  [translator.md](translator.md) for the exact key list. `Translator.t()` has
  no interpolation, so any message that includes the poll title is composed
  in JSX (translated fragment + `{poll.title}`), not baked into the YAML
  string.
