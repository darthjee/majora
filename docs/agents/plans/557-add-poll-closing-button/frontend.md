# Frontend Plan: Add poll closing button

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts". This agent consumes the new
`PATCH games/<slug>/polls/<id>/close.json` endpoint, the `selected` field now
present on each option in `PollDetailSerializer`'s payload, and implements the
"can close" rule (`access.is_dm || access.is_superuser`). It depends on
[translator.md](translator.md)'s new `game_poll_page.*` keys existing before
its own Jasmine specs can assert on translated copy (or agents can land
keys/UI together — no strict ordering requirement beyond both landing before
the PR is done).

## Implementation Steps

### Step 1 — `PollClient.closePoll`

- `frontend/assets/js/client/PollClient.js`: add
  `closePoll(gameSlug, pollId, token, optionId = null)` calling
  `this.patchJson('/games/${gameSlug}/polls/${pollId}/close.json', token, optionId != null ? { option_id: optionId } : {}, { 'X-Skip-Cache': 'true' })`,
  documented the same way as the other methods in this file.

### Step 2 — Compute vote tallies for the modal preview

- The poll detail page doesn't currently fetch/display vote counts at all.
  The confirmation modal needs them (to highlight the winner / detect a tie)
  without a new preview endpoint: reuse the existing
  `pollClient.fetchPollVotes(gameSlug, id, token)` (no `user_id` filter) to
  get every vote, then tally counts per `option_id` client-side.
- Do this fetch when the close modal opens (DM/admin only — regular
  players/viewers never trigger it), not unconditionally on page load, to
  avoid an extra request for viewers who can't close the poll.

### Step 3 — `canClose` in `GamePollController`

- Add a `static #canClose(access)` mirroring `#canVote`, returning
  `Boolean(access.is_dm || access.is_superuser)`, and thread a `canClose`
  setter through the constructor the same way `setCanVote` is threaded today.
  Compute it alongside `canVote` in `#handleAccess`.

### Step 4 — Close confirmation modal component

- New `PollCloseModal` (Component/Helper/Controller trio, following
  `SlainConfirmModal.jsx` / `SlainConfirmModalHelper.jsx` as the closest
  existing precedent for a confirm-style modal) under
  `frontend/assets/js/components/resources/game/pages/elements/`:
  - Props: poll (title, type, options), tallied vote counts from Step 2,
    open/close state, submit handler.
  - Bootstrap `Form.Check type="switch"` for "Override Decision"
    (`game_poll_page.override_decision_label`), default off.
  - Off state: compute the max vote count; if exactly one option has it,
    render it alone with a pastel-green background class; if multiple tie,
    render the lowest-id one green (the effective winner) plus the rest in
    pastel red, and show an alert
    (`game_poll_page.close_tie_alert`).
  - On state: render every option with a radio input on the left
    (`name` scoped per-poll like the existing vote radios), pre-selecting
    none (or the auto-picked winner as a sensible default — pick whichever
    reads better; not specified by the issue). Options that are part of the
    max-vote set get the pastel-green hint background regardless of
    selection.
  - Submit calls `pollClient.closePoll` with `null` (off state) or the
    radio-selected id (on state); Cancel just closes the modal, no request.
  - Pastel green/red: reuse Bootstrap-ish subtle backgrounds already used
    elsewhere in the app if a shared utility class exists (check
    `frontend/assets/css` first); otherwise add small scoped classes local to
    this component's stylesheet — don't invent a new global color system for
    two colors.

### Step 5 — Wire the button into `GamePoll.jsx` / `GamePollHelper.jsx`

- Render a "Close Poll" button (label:
  `game_poll_page.close_button`) next to/near the existing page actions,
  visible only when `canClose && poll.status === 'open'` (mirrors the
  backend's status guard so the button doesn't offer an action the API would
  reject).
- Clicking opens `PollCloseModal`; on a successful close response, update the
  page's `poll` state from the response body (which already contains the new
  `status` and each option's `selected` flag) instead of a full refetch.

### Step 6 — Winner display after close

- In `GamePollHelper.#renderOptions` (the read-only branch, used once
  `poll.status !== 'open'`), mark the option with `selected: true` — e.g. a
  small "Winner" badge (`game_poll_page.winner_badge`) or the same
  pastel-green background used in the modal, whichever composes more simply
  with the existing `<PollOptionValue>` row markup.

### Step 7 — Tests

- `frontend/specs/.../client/PollClient/closePollSpec.js` — new, covers the
  method's request shape (both empty and `option_id` payloads).
- `frontend/specs/.../controllers/GamePollController/` — cover `#canClose`
  the same way `#canVote`-adjacent behavior is already covered.
- New specs for `PollCloseModal`/its helper/controller, covering: switch
  toggle, tie detection/highlighting + alert, radio selection in override
  mode, submit payload in both modes, cancel no-ops.
- `GamePollSpec.js` / `GamePollHelperSpec.js` — cover the button's
  visibility rule (`canClose && status === 'open'`) and the post-close
  winner badge rendering.

## Files to Change

- `frontend/assets/js/client/PollClient.js` — add `closePoll`.
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js` —
  add `canClose` resolution.
- `frontend/assets/js/components/resources/game/pages/GamePoll.jsx` — wire
  the button + modal + post-close state update.
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` —
  render the button and the winner badge.
- `frontend/assets/js/components/resources/game/pages/elements/PollCloseModal.jsx` — new.
- `frontend/assets/js/components/resources/game/pages/elements/helpers/PollCloseModalHelper.jsx` — new.
- `frontend/assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js` — new.
- Matching new/updated files under `frontend/specs/assets/js/...` mirroring
  every file above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) runs the full Jasmine
  suite with coverage.
- `frontend`: `npm run lint` (CI job: `frontend-checks`).
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail
  until [translator.md](translator.md)'s keys exist in both `en.yaml` and
  `pt.yaml`.

## Notes

- Confirm during implementation whether the codebase already has a shared
  "pastel green/red" utility class (grep `frontend/assets/css`) before
  introducing new ones.
- The override-mode default radio selection (none vs. auto-picked winner)
  isn't specified by the issue; use judgement and keep it easy to change if
  product feedback disagrees.
