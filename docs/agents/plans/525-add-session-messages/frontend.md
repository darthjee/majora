# Frontend Plan: Add session messages

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `GET`/`POST /games/<game_slug>/sessions/<session_id>/messages.json` — see
  [plan.md](plan.md)'s "Shared contracts" for the exact payload/header shape, including the
  `NEXT-ENTRY-ID` header and the intentional first-item duplication on cursor pages.
- Consumes the new i18n keys from `translator.md`.

## Implementation Steps

### Step 1 — New "load more" pagination component

Add `frontend/assets/js/components/common/LoadMoreButton.jsx`, distinct from the existing
numbered-page `Pagination.jsx`:

```jsx
/**
 * Button for cursor-based "load more" pagination, shown only while more items remain.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether more items remain to load.
 * @param {boolean} props.loading - Whether a load is currently in flight.
 * @param {Function} props.onClick - Click handler to fetch the next page.
 * @param {string} props.label - Button label.
 * @returns {React.ReactElement|null} Button element, or null when not visible.
 */
export default function LoadMoreButton({ visible, loading, onClick, label }) {
  if (!visible) return null;
  return (
    <button type="button" className="btn btn-outline-secondary mt-3" onClick={onClick} disabled={loading}>
      {label}
    </button>
  );
}
```

Add its spec at `frontend/specs/assets/js/components/common/LoadMoreButtonSpec.js`,
mirroring `CardAvatarSpec.js`'s structure (renders/hides based on `visible`, respects
`disabled` while `loading`).

### Step 2 — Extend `GameSessionClient` with message endpoints

`frontend/assets/js/client/GameSessionClient.js`:

```js
/**
 * Fetches a page of a session's messages.
 *
 * @param {string} gameSlug - Game slug.
 * @param {number|string} sessionId - Session id.
 * @param {string|null} token - Authentication token, if any.
 * @param {number|string|null} [nextEntryId] - Cursor from a previous page's NEXT-ENTRY-ID header.
 * @returns {Promise<Response>} fetch response from the messages endpoint.
 */
fetchMessages(gameSlug, sessionId, token, nextEntryId) {
  const query = nextEntryId ? `?next-entry-id=${nextEntryId}` : '';
  return this.getJson(`/games/${gameSlug}/sessions/${sessionId}/messages.json${query}`, token);
}

/**
 * Posts a new message to a session.
 *
 * @param {string} gameSlug - Game slug.
 * @param {number|string} sessionId - Session id.
 * @param {string|null} token - Authentication token, if any.
 * @param {string} content - Message content.
 * @returns {Promise<Response>} fetch response from the messages endpoint.
 */
createMessage(gameSlug, sessionId, token, content) {
  return this.postJson(`/games/${gameSlug}/sessions/${sessionId}/messages.json`, token, { content });
}
```

### Step 3 — `SessionMessagesController`

Add `frontend/assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js`,
a sibling controller to `GameSessionController` (kept separate rather than merged into it —
the session detail fetch and the messages feed have independent loading/error lifecycles):

```js
import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the session messages section (list + post form).
 */
export default class SessionMessagesController extends BasePageController {
  /**
   * @param {Function} setMessages - Messages array setter.
   * @param {Function} setNextEntryId - Cursor setter (null when no more pages).
   * @param {Function} setLoadingMore - "load more" in-flight setter.
   * @param {GameSessionClient|null} [client] - Client override.
   */
  constructor(setMessages, setNextEntryId, setLoadingMore, client = null) {
    super();
    this.setMessages = setMessages;
    this.setNextEntryId = setNextEntryId;
    this.setLoadingMore = setLoadingMore;
    this.client = client ?? new GameSessionClient();
  }

  /**
   * Fetch and replace the first page of messages, discarding anything previously loaded.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} sessionId - Session id.
   * @returns {Promise<void>} Resolves once the first page is loaded (or the fetch failed).
   */
  async loadFirstPage(gameSlug, sessionId) {
    const token = AuthStorage.getToken();
    return this.client.fetchMessages(gameSlug, sessionId, token)
      .then((response) => this.#applyPage(response, []))
      .catch(() => {});
  }

  /**
   * Fetch the next page using the current cursor and append it, deduping the repeated
   * boundary message the backend intentionally returns as the first item of the new page.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} sessionId - Session id.
   * @param {Array} currentMessages - Currently loaded messages.
   * @param {number|string} nextEntryId - Cursor from the previous page's NEXT-ENTRY-ID header.
   * @returns {Promise<void>} Resolves once the next page is appended (or the fetch failed).
   */
  async loadMore(gameSlug, sessionId, currentMessages, nextEntryId) {
    const token = AuthStorage.getToken();
    this.setLoadingMore(true);
    return this.client.fetchMessages(gameSlug, sessionId, token, nextEntryId)
      .then((response) => this.#applyPage(response, currentMessages, true))
      .catch(() => {})
      .finally(() => this.setLoadingMore(false));
  }

  async #applyPage(response, existingMessages, dedupeFirst = false) {
    if (!response.ok) return;
    const nextEntryId = response.headers.get('NEXT-ENTRY-ID') || null;
    const page = await response.json();
    const newItems = dedupeFirst ? page.slice(1) : page;
    this.setMessages([...existingMessages, ...newItems]);
    this.setNextEntryId(nextEntryId);
  }
}
```

### Step 4 — `SessionMessagesHelper` and the post form

Add `frontend/assets/js/components/resources/game_session/pages/helpers/SessionMessagesHelper.jsx`,
using existing `FormField`/`SubmitButton` (same convention as `MyAccountHelper.jsx`) and the
new `Avatar` component from #528 for each message author:

```jsx
import Avatar from '../../../../common/Avatar.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import LoadMoreButton from '../../../../common/LoadMoreButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

export default class SessionMessagesHelper {
  static render(state, handlers) {
    return (
      <div className="row mt-4">
        <div className="col-md-8">
          <h2>{Translator.t('game_session_page.messages_title')}</h2>
          {state.messages.map((message) => (
            <div key={message.id} className="d-flex align-items-start mb-3">
              <Avatar url={message.user.avatar_url} alt={message.user.name} />
              <div className="ms-2">
                <strong>{message.user.name}</strong>
                <p className="text-pre-wrap mb-0">{message.content}</p>
              </div>
            </div>
          ))}
          <LoadMoreButton
            visible={Boolean(state.nextEntryId)}
            loading={state.loadingMore}
            onClick={handlers.onLoadMore}
            label={Translator.t('game_session_page.messages_load_more')}
          />
        </div>
        <div className="col-md-4">
          <form onSubmit={handlers.onSubmit}>
            <TextareaField
              id="session-message-content"
              label={Translator.t('game_session_page.messages_content_label')}
              value={state.content}
              onChange={handlers.onContentChange}
              errors={state.fieldErrors.content ?? []}
            />
            <SubmitButton disabled={state.posting}>
              {Translator.t('game_session_page.messages_submit')}
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }
}
```

Uses the existing `TextareaField` (`frontend/assets/js/components/common/TextareaField.jsx`)
for the free-text content field — the same component `GameSessionNewHelper.jsx` already
uses for its `description` field — rather than `FormField`, which only renders a plain
`<input>` and has no multi-line variant.

### Step 5 — Wire into `GameSession.jsx` and `GameSessionHelper.jsx`

`frontend/assets/js/components/resources/game_session/pages/GameSession.jsx`: add
`messages`/`nextEntryId`/`loadingMore`/`content`/`posting`/`fieldErrors` state, a
`SessionMessagesController` instance, an effect to call `loadFirstPage` once the session
itself has loaded (needs `gameSlug`/`sessionId`, available once `session` state is set), and
handlers:
- `onLoadMore`: calls `controller.loadMore(gameSlug, sessionId, messages, nextEntryId)`.
- `onContentChange`: updates `content`.
- `onSubmit`: prevents default, POSTs via `client.createMessage(...)`, and on success calls
  `controller.loadFirstPage(gameSlug, sessionId)` again (discarding `messages`/`nextEntryId`
  and refetching page 1 fresh) plus clears `content` — matching the issue's "posting a
  message loads the messages again, clearing the current messages."

`frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx`:
render `SessionMessagesHelper.render(messagesState, messagesHandlers)` right after the
existing `{session.description && (...)}` block (bottom of the page, per the issue).

## Files to Change

- `frontend/assets/js/components/common/LoadMoreButton.jsx` — new component
- `frontend/specs/assets/js/components/common/LoadMoreButtonSpec.js` — new spec
- `frontend/assets/js/client/GameSessionClient.js` — add `fetchMessages`/`createMessage`
- `frontend/assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js` — new controller
- `frontend/assets/js/components/resources/game_session/pages/helpers/SessionMessagesHelper.jsx` — new helper
- `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx` — wire in messages state/controller/handlers
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx` — render the messages section
- Specs mirroring each of the above under `frontend/specs/assets/js/components/resources/game_session/...`

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the
  `translator` agent's new `game_session_page.messages_*` keys land in both `en.yaml` and `pt.yaml`

## Notes

- Depends on #528's `Avatar` component (`frontend/assets/js/components/common/Avatar.jsx`)
  existing on `main` — if #528 hasn't landed yet when this is implemented, that component
  must exist first (it's a hard dependency, same as the backend's `email_hash`/`avatar_url`).
- Keep `SessionMessagesController` separate from `GameSessionController` — the session
  detail and the messages feed have independent loading states, and merging them would
  block the whole page behind the messages fetch.
