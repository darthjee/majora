# Frontend Plan: Add session pool

Main plan: [plan.md](plan.md)

## Shared contracts

- New endpoint: `POST /games/<slug>/sessions/<id>/poll.json`, body `{"dates": ["YYYY-MM-DD", ...]}`,
  `201` response shaped like a poll detail object (`id, title, description, type, status,
  option_type, options`).
- Depends on #546's frontend deliverables: `PollOptionType.js` (constants), `PollOptionInput.jsx`
  (type-aware date/text input), both under
  `frontend/assets/js/components/resources/game/pages/elements/`.
- Depends on translator plan for: `game_session_page.create_pool`, `session_poll_modal.title`,
  `session_poll_modal.dates_label`, `session_poll_modal.confirm`, `session_poll_modal.cancel`,
  `session_poll_modal.error`.

## Implementation Steps

### Step 1 — Client method

In `frontend/assets/js/client/GameSessionClient.js`, add:

```js
createSessionPoll(gameSlug, sessionId, token, dates) {
  return this.postJson(`/games/${gameSlug}/sessions/${sessionId}/poll.json`, token, { dates });
}
```

Same style/placement as the existing `createMessage` method.

### Step 2 — Create-pool modal

New files under `frontend/assets/js/components/resources/game_session/pages/elements/`
(mirroring `resources/game/pages/elements/`'s component+helper+controller split, and
`MoneyEditModal`'s shell pattern):

- `controllers/CreateSessionPollModalController.js` — pure state helpers for the dynamic dates
  list. Reuse `GamePollNewController.handleOptionChange`/`handleOptionRemove` directly (they
  operate on a generic `string[]`/`setOptions`, nothing poll-specific) rather than
  reimplementing the same auto-append/remove logic — either import them directly or, if that
  cross-page import reads awkwardly, extract them into a small shared util both controllers call.
  Judge based on how it reads once written.
- `CreateSessionPollModal.jsx` — props: `{ show, onClose, onConfirm }` where `onConfirm(dates)` is
  called with the filled (non-blank) dates array on submit; owns its own `dates` state (seeded to
  `['']` whenever `show` becomes true, same seeding pattern as `MoneyEditModal`'s `breakdown`).
- `helpers/CreateSessionPollModalHelper.jsx` — renders a `react-bootstrap` `Modal` (same
  `Modal`/`Modal.Header`/`Modal.Body`/`Modal.Footer` shell as `MoneyEditModalHelper`), with one
  `PollOptionInput` (`optionType={PollOptionType.OPTION_TYPE_DATE}`) row per date entry, and
  Confirm/Cancel buttons (`session_poll_modal.confirm`/`cancel`). Confirm is disabled while no
  non-blank date is present.

### Step 3 — Wire the button and modal into the session page

In `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx`:
- Add `const [showPollModal, setShowPollModal] = useState(false)` and a `status`/`fieldErrors`-ish
  submit handler (`handleCreatePoll`) that calls `client.createSessionPoll(session.game_slug,
  session.id, token, dates)` and, on `201`, redirects to `#/games/<game_slug>/polls/<id>` (same
  redirect shape as `GamePollNewController#handleResponse`); on failure, keep the modal open and
  surface an error (reuse the `session_poll_modal.error` key, no need for per-field errors since
  the only field is the dates list).
- Render `<CreateSessionPollModal show={showPollModal} onClose={...} onConfirm={handleCreatePoll} />`
  alongside the page's main return, same placement style as `MoneyEditModal` usage in
  `GameTreasureNew.jsx`.

In `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx`:
- Add a "Create Pool" button, shown only when `session.can_edit && !session.date` (guardrail:
  do **not** loosen this to match the endpoint's broader DM+player+admin permission — the button
  visibility is intentionally DM-only per the issue). Place it in `PageActions` next to the
  existing `EditButton`, opening the modal via an `onOpenPollModal` handler prop.

### Step 4 — Tests

- `CreateSessionPollModalHelperSpec.js` / `CreateSessionPollModalSpec.js` (new, under
  `frontend/specs/.../game_session/pages/elements/`): cover the dynamic date-row add/remove
  behavior, Confirm disabled-when-empty state, and that `onConfirm` receives only non-blank
  dates.
- `GameSessionHelperSpec.js`: cover the button appearing only when `can_edit && !date`, and
  absent when either condition is false.
- `GameSessionSpec.js`: cover the submit flow — success redirects to the new poll, failure shows
  the error and keeps the modal open.
- `GameSessionClient` spec directory: new `createSessionPollSpec.js` mirroring
  `createMessageSpec.js`.

## Files to Change

- `frontend/assets/js/client/GameSessionClient.js` — add `createSessionPoll`.
- `frontend/assets/js/components/resources/game_session/pages/elements/CreateSessionPollModal.jsx` — new.
- `frontend/assets/js/components/resources/game_session/pages/elements/controllers/CreateSessionPollModalController.js` — new.
- `frontend/assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx` — new.
- `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx` — modal state + submit handler.
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx` — "Create Pool" button.
- New/updated specs listed in Step 4.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `Check JS Lint`).

## Notes

- Hard dependency on #546's `PollOptionType.js`/`PollOptionInput.jsx` — do not duplicate a
  second date-input implementation here.
- Do not add any poll summary/link to `GameSessionHelper`'s normal (non-modal) render output —
  per the product-owner review, the session detail payload is public and must not surface
  DM/player-gated poll content.
