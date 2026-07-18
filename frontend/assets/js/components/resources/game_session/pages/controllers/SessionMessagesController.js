import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the session messages section (list + post form).
 */
export default class SessionMessagesController extends BasePageController {
  /**
   * Create a session messages controller.
   *
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
      .catch(Noop.noop);
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
      .catch(Noop.noop)
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
