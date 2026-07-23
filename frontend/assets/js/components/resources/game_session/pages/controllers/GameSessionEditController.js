import GameSessionClient from '../../../../../client/GameSessionClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BaseEditController from '../../../../common/base/controllers/BaseEditController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game session edit page.
 */
export default class GameSessionEditController extends BaseEditController {
  /**
   * Extract game slug and session id from a session edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Session route params.
   */
  static getSessionParamsFromEditHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/sessions/:id/edit', hash, ['game_slug', 'id'],
    );
  }

  /**
   * Create a game session edit controller.
   *
   * @param {Function} setSession - Session setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {GameSessionClient|null} [sessionClient] - Session client override.
   */
  constructor(setSession, setLoading, setError, setFieldErrors = Noop.noop, sessionClient = null) {
    super(setSession, setLoading, setError, setFieldErrors);
    this.sessionClient = sessionClient ?? new GameSessionClient();
  }

  /**
   * Load the game session.
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  loadResource(safeSet) {
    const hash = getCurrentHash();
    const { game_slug: gameSlug, id } = GameSessionEditController.getSessionParamsFromEditHash(hash);

    if (!gameSlug || !id) {
      safeSet(this.setError, 'Unable to load session.');
      safeSet(this.setLoading, false);
      return;
    }

    this.fetchDataWithAccess(
      RequestStore.ensure({
        componentName: 'GameSessionEditController',
        resource: 'session',
        quantityType: 'single',
        params: { gameSlug, id },
      }),
      AccessStore.ensureGamePermissions(gameSlug),
      safeSet,
      'Unable to load session.',
    );
  }

  /**
   * Submit a partial update for the session.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} id - Session id.
   * @param {{title: string, date: string, description: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, id, formValues, setters) {
    const token = AuthStorage.getToken();

    return this.performSubmit(
      event,
      setters,
      () => this.sessionClient.updateSession(gameSlug, id, token, {
        title: formValues.title,
        date: formValues.date || null,
        description: formValues.description || null,
      }),
      `/games/${gameSlug}/sessions/${id}`,
    );
  }
}
