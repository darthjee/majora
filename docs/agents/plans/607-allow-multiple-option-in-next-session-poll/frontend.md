# Frontend Plan: Allow multiple option in next session poll

Main plan: [plan.md](plan.md)

## Shared contracts

- `GameSessionClient.createSessionPoll(gameSlug, sessionId, token, dates, type)` must post `{ dates, type }` to `POST /games/<game_slug>/sessions/<session_id>/poll.json` (backend already accepts `type` per [backend.md](backend.md), defaulting server-side to `'multiple'` if omitted — but the frontend should always send it explicitly once the selector exists).
- Depends on three new i18n keys under `session_poll_modal` (`type_label`, `type_single`, `type_multiple`) being added by [translator](translator.md) before this UI ships — reference them via `Translator.t('session_poll_modal.type_label')` etc., same pattern as `GamePollNewHelper.#renderTypeField`.

## Implementation Steps

### Step 1 — Add `type` state to `CreateSessionPollModal`

In `frontend/assets/js/components/resources/game_session/pages/elements/CreateSessionPollModal.jsx`:
- Add `const [type, setType] = useState('multiple');` alongside the existing `dates` state.
- Reset it to `'multiple'` in the same `useEffect` that resets `dates` whenever the modal opens (`if (!show) return; setDates(['']); setType('multiple');`).
- Update `handleConfirm` to call `onConfirm(CreateSessionPollModalController.nonBlankDates(dates), type)`.
- Pass `type` and an `onTypeChange: (value) => setType(value)` handler down to `CreateSessionPollModalHelper.render`.

### Step 2 — Render the type selector

In `frontend/assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx`:
- Add a `#renderTypeField` static method mirroring `GamePollNewHelper.#renderTypeField` (radio buttons for `['single', 'multiple']`, ids like `session-poll-type-${type}`, `name="session-poll-type"`, labels via `Translator.t(\`session_poll_modal.type_${type}\`)`), reusing the local `POLL_TYPES = ['single', 'multiple']` constant.
- Call it from `render()`, before or after the dates list (place it above the dates label, matching the generic form's field order: type before options).
- Update the JSDoc for `state`/`handlers` to document the new `type`/`onTypeChange`.

### Step 3 — Thread `type` through to the API call

- `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx`: update `handleCreatePoll` to `(dates, type) => controller.submitPoll(session.game_slug, session.id, dates, type, { setPollStatus })`.
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js`: update `submitPoll(gameSlug, sessionId, dates, type, setters)` to pass `type` through to `this.sessionClient.createSessionPoll(gameSlug, sessionId, token, dates, type)`.
- `frontend/assets/js/client/GameSessionClient.js`: update `createSessionPoll(gameSlug, sessionId, token, dates, type)` to `postJson(..., { dates, type })`, updating its JSDoc accordingly.

### Step 4 — Update specs

- Update/add Jasmine specs for `CreateSessionPollModal`, `CreateSessionPollModalHelper`, `GameSessionController#submitPoll`, and `GameSessionClient#createSessionPoll` to cover the new `type` state/param, including that it defaults to `'multiple'` and resets on modal reopen.

## Files to Change

- `frontend/assets/js/components/resources/game_session/pages/elements/CreateSessionPollModal.jsx` — add `type` state, reset-on-open, thread through `onConfirm`.
- `frontend/assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx` — render the single/multiple radio selector.
- `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx` — pass `type` through `handleCreatePoll`.
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js` — pass `type` through `submitPoll`.
- `frontend/assets/js/client/GameSessionClient.js` — include `type` in the POST body of `createSessionPoll`.
- Corresponding `*.test.js`/`*.test.jsx` spec files for the above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Do not add or edit i18n YAML files directly — that's [translator](translator.md)'s scope; only reference the keys via `Translator.t(...)`.
- `CreateSessionPollModalController` currently has no type-related logic (it only manages the dates list) — no changes needed there unless review turns up shared logic worth extracting.
