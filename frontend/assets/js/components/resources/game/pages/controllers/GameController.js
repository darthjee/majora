import GenericClient from '../../../../../client/GenericClient.js';
import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import { MAX_PREVIEW_CHARACTERS } from '../../../../elements/characterPreviewConstants.js';
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
      .then((game) => this.#mergeAccess(gameSlug, game))
      .then((game) => safeSet(this.setGame, game))
      .catch(() => safeSet(this.setError, 'Unable to load game.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #mergeAccess(gameSlug, game) {
    return Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ]).then(([access, permissions]) => ({ ...game, ...access, ...permissions }));
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
    this.client.fetch(`/games/${gameSlug}/pcs.json?per_page=${MAX_PREVIEW_CHARACTERS}`)
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
    const publicFetch = this.client.fetch(
      `/games/${gameSlug}/npcs.json?per_page=${MAX_PREVIEW_CHARACTERS}`,
    );
    const allFetch = token
      ? this.characterClient.fetchNpcsAll(gameSlug, token, { per_page: MAX_PREVIEW_CHARACTERS })
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
