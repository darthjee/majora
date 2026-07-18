import GenericClient from '../../../../../client/GenericClient.js';
import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import { MAX_PREVIEW_ITEMS, PREVIEW_LIST_TYPES } from '../../../../common/cards/characterPreviewConstants.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for game detail page.
 */
export default class GameController extends BasePageController {
  /**
   * Extract game slug from hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug', 'game_slug', hash);
  }

  /**
   * Create a game controller.
   *
   * @param {Function} setGame - Game setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} [setPcs] - PCs preview setter.
   * @param {Function} [setNpcs] - NPCs preview setter.
   * @param {GenericClient|null} client - Client override.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setGame,
    setLoading,
    setError,
    setPcs = Noop.noop,
    setNpcs = Noop.noop,
    client = null,
    characterClient = null,
  ) {
    super();
    this.setGame = setGame;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setPcs = setPcs;
    this.setNpcs = setNpcs;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const gameSlug = GameController.getGameSlugFromHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load game.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchGame(gameSlug, safeSet);
        this.#fetchPcsPreview(gameSlug, safeSet);
        this.#fetchNpcsPreview(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchGame(gameSlug, safeSet) {
    this.client.fetch(`/games/${gameSlug}.json`)
      .then((game) => this.#renderGame(gameSlug, game, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load game.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Render the game right away using AccessStore's synchronous, fail-closed
   * access/permissions readers, then re-render once the real values resolve
   * in the background so the page picks them up without blocking the first
   * render on the access/permissions fetches.
   *
   * @param {string} gameSlug - Game slug.
   * @param {object} game - Base game data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {void}
   */
  #renderGame(gameSlug, game, safeSet) {
    safeSet(this.setGame, this.#mergeAccess(gameSlug, game));

    Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ]).then(() => safeSet(this.setGame, this.#mergeAccess(gameSlug, game)));
  }

  #mergeAccess(gameSlug, game) {
    return {
      ...game,
      ...AccessStore.getGameAccess(gameSlug),
      ...AccessStore.getGamePermissions(gameSlug),
    };
  }

  /**
   * Fetch the PCs preview list, resolving to an empty list on failure so
   * the secondary fetch never blocks rendering of the game page.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} safeSet - Setter wrapper that only updates while mounted.
   * @returns {void}
   */
  #fetchPcsPreview(gameSlug, safeSet) {
    const endpoint = PREVIEW_LIST_TYPES.pc.buildEndpoint({ gameSlug });

    this.client.fetch(`${endpoint}?per_page=${MAX_PREVIEW_ITEMS}`)
      .then((pcs) => safeSet(this.setPcs, Array.isArray(pcs) ? pcs : []))
      .catch(() => safeSet(this.setPcs, []));
  }

  /**
   * Fetch the NPCs preview list, preferring the authenticated all.json result
   * when a token is available and the request succeeds, otherwise falling back
   * to the public listing. Never blocks rendering of the game page.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} safeSet - Setter wrapper that only updates while mounted.
   * @returns {void}
   */
  #fetchNpcsPreview(gameSlug, safeSet) {
    const token = AuthStorage.getToken();
    const endpoint = PREVIEW_LIST_TYPES.npc.buildEndpoint({ gameSlug });
    const publicFetch = this.client.fetch(`${endpoint}?per_page=${MAX_PREVIEW_ITEMS}`);
    const allFetch = token
      ? this.characterClient.fetchNpcsAll(gameSlug, token, { per_page: MAX_PREVIEW_ITEMS })
      : Promise.resolve(null);

    Promise.allSettled([publicFetch, allFetch])
      .then(([publicResult, allResult]) =>
        this.#applyNpcsPreviewResult(publicResult, allResult, safeSet))
      .catch(() => safeSet(this.setNpcs, []));
  }

  async #applyNpcsPreviewResult(publicResult, allResult, safeSet) {
    if (allResult.status === 'fulfilled' && allResult.value?.ok) {
      const data = await allResult.value.json().catch(() => null);
      if (Array.isArray(data)) {
        safeSet(this.setNpcs, data);
        return;
      }
    }

    const fallback = publicResult.status === 'fulfilled' ? publicResult.value : [];
    safeSet(this.setNpcs, Array.isArray(fallback) ? fallback : []);
  }
}
