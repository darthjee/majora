# Session request config and picker helpers

- `sessionConfig.js`: add `GET.collection` → `{ path: ({ gameSlug }) => `/games/${gameSlug}/sessions.json`, permission: null }`, with `regular`/`private` pointing at the same object. Update the header JSDoc, which currently says no collection `GET` is configured.
- Add a `taskSessions.js` helper next to `taskCategories.js` with:
  - `SESSION_PICKER_MAX_ENTRIES = 5`
  - `buildSessionPicker(gameSlug)` → `{ resource: 'session', maxEntries: 5, params: { gameSlug } }`
  - `toTaskSessionPick(session)` → `{ id, name: title }` or `null`

Specs for the helpers and the config entry.

## Files to Change
- `frontend/assets/js/utils/requests/config/sessionConfig.js` — `GET.collection`.
- `frontend/assets/js/components/resources/game/pages/taskSessions.js` — new helpers.
- Specs for both.
