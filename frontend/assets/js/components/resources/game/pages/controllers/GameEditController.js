import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BaseEditController from '../../../../common/base/controllers/BaseEditController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Controller for the game edit page.
 */
export default class GameEditController extends BaseEditController {
  /**
   * Extract game slug from a game edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromEditHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/edit', 'game_slug', hash);
  }

  /**
   * Create a game edit controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   */
  constructor(setGame, setLoading, setError, setFieldErrors = Noop.noop) {
    super(setGame, setLoading, setError, setFieldErrors);
  }

  /**
   * Load the game and its access identity/permissions.
   *
   * @description Merges both `AccessStore.ensureGameAccess` (`is_player`/`is_staff`, needed to
   *   decide whether a regular, non-full editor may reach this page at all) and
   *   `AccessStore.ensureGamePermissions` (`can_edit`) onto the loaded game.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  loadResource(safeSet) {
    const hash = getCurrentHash();
    const gameSlug = GameEditController.getGameSlugFromEditHash(hash);

    if (!gameSlug) {
      safeSet(this.setError, 'Unable to load game.');
      safeSet(this.setLoading, false);
      return;
    }

    const accessAndPermissions = Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ]).then(([access, permissions]) => ({ ...access, ...permissions }));

    this.fetchDataWithAccess(
      RequestStore.ensure({
        componentName: 'GameEditController', resource: 'game', quantityType: 'single', params: { gameSlug },
      }),
      accessAndPermissions,
      safeSet,
      'Unable to load game.',
    );
  }

  /**
   * Submit a partial update for the game.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   PATCH request through {@link RequestStore.mutate} (issue #844, so the game's cached `GET`
   *   data is purged on success), then redirects on success, sets field errors on 400, or sets
   *   error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, description: string, links: object[]}} formValues - Raw form field
   *   values. `links` is always sent; a regular (non-full) editor's `name` value is silently
   *   dropped server-side by the regular-tier serializer, so no frontend gating is needed here.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  submitForm(event, gameSlug, formValues, setters) {
    return this.performSubmit(
      event,
      setters,
      () => RequestStore.mutate({
        componentName: 'GameEditController',
        resource: 'game',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug },
        body: {
          name: formValues.name,
          description: formValues.description,
          links: formValues.links,
        },
      }),
      `/games/${gameSlug}`,
    );
  }
}
