import GameClient from '../../../client/GameClient.js';
import TreasureClient from '../../../client/TreasureClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BaseEditController from './BaseEditController.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the game treasure edit page.
 */
export default class GameTreasureEditController extends BaseEditController {
  /**
   * Extract game slug and treasure id from a game treasure edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, treasure_id: string}} Route params.
   */
  static getGameTreasureEditParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/treasures/:treasure_id/edit', hash, ['game_slug', 'treasure_id'],
    );
  }

  /**
   * Create a game treasure edit controller.
   *
   * @param {Function} setTreasure - Treasure setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   * @param {GameClient|null} [gameClient] - Game client override, used for the access check.
   */
  constructor(
    setTreasure, setLoading, setError, setFieldErrors = Noop.noop, treasureClient = null, gameClient = null,
  ) {
    super(setTreasure, setLoading, setError, setFieldErrors);
    this.treasureClient = treasureClient ?? new TreasureClient();
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Load the game-scoped treasure, gated on the current user being able to
   * edit the game (redirects to the game's treasures index otherwise).
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  loadResource(safeSet) {
    const hash = typeof window === 'undefined' ? '' : window.location.hash;
    const { game_slug: gameSlug, treasure_id: treasureId } =
      GameTreasureEditController.getGameTreasureEditParamsFromHash(hash);
    const token = AuthStorage.getToken();

    this.gameClient.fetchGameAccess(gameSlug, token)
      .then((response) => (response.ok ? response.json() : { can_edit: false }))
      .then((access) => this.#handleAccess(access, gameSlug, treasureId, safeSet))
      .catch(() => this.redirectTo(`/games/${gameSlug}/treasures`));
  }

  /**
   * Submit a partial update for the treasure.
   *
   * @description Prevents the default form submission, resets status and
   *   field errors, sends a PATCH request, then redirects on success,
   *   sets field errors on 400, or sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} id - Treasure id.
   * @param {{name: string, value: string}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, id, formValues, setters) {
    const token = AuthStorage.getToken();

    return this.performSubmit(
      event,
      setters,
      () => this.treasureClient.updateGameTreasure(gameSlug, id, token, {
        name: formValues.name,
        value: parseInt(formValues.value, 10),
      }),
      `/games/${gameSlug}/treasures/${id}`,
    );
  }

  #handleAccess(access, gameSlug, treasureId, safeSet) {
    if (!access.can_edit) {
      this.redirectTo(`/games/${gameSlug}/treasures`);
      return;
    }

    if (!treasureId) {
      safeSet(this.setError, 'Unable to load treasure.');
      safeSet(this.setLoading, false);
      return;
    }

    const token = AuthStorage.getToken();

    this.fetchSingle(
      this.treasureClient.fetchGameTreasure(gameSlug, treasureId, token),
      safeSet,
      'Unable to load treasure.',
    );
  }
}
