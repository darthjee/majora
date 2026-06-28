import GenericClient from '../../../client/GenericClient.js';
import CharacterClient from '../../../client/CharacterClient.js';
import AuthStorage from '../../../utils/AuthStorage.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug from NPCs hash route.
 *
 * @param {string} hash - Current hash.
 * @returns {string} Game slug.
 */
export function getGameSlugFromNpcsHash(hash = '') {
  return Router.extractParams('/games/:game_slug/npcs', hash).game_slug ?? '';
}

/**
 * Controller for game NPCs page.
 */
export default class GameNpcsController extends BasePageController {
  /**
   * Create a game NPCs controller.
   *
   * @param {Function} setNpcs - NPCs setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {CharacterClient|null} characterClient - Character client override.
   */
  constructor(setNpcs, setPagination, setLoading, setError, client = null, characterClient = null) {
    super();
    this.setNpcs = setNpcs;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
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
      const gameSlug = getGameSlugFromNpcsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load NPCs.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchNpcs(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchNpcs(gameSlug, safeSet) {
    const token = AuthStorage.getToken();
    const publicFetch = this.client.fetchIndex(`/games/${gameSlug}/npcs.json`);
    const allFetch = token
      ? this.characterClient.fetchNpcsAll(gameSlug, token)
      : Promise.resolve(null);

    Promise.allSettled([publicFetch, allFetch])
      .then(([publicResult, allResult]) => this.#applyNpcsResult(publicResult, allResult, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load NPCs.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #applyNpcsResult(publicResult, allResult, safeSet) {
    const authNpcs = await this.#tryGetAuthNpcs(allResult);

    if (authNpcs !== null) {
      this.#applyAuthNpcs(authNpcs, publicResult, safeSet);
      return;
    }

    if (publicResult.status === 'fulfilled') {
      const { data, pagination } = publicResult.value;
      safeSet(this.setNpcs, Array.isArray(data) ? data : []);
      safeSet(this.setPagination, pagination);
    } else {
      throw new Error('Unable to load NPCs.');
    }
  }

  #applyAuthNpcs(authNpcs, publicResult, safeSet) {
    safeSet(this.setNpcs, authNpcs);
    if (publicResult.status === 'fulfilled') {
      safeSet(this.setPagination, publicResult.value.pagination);
    }
  }

  #tryGetAuthNpcs(allResult) {
    if (allResult.status !== 'fulfilled' || !allResult.value?.ok) {
      return Promise.resolve(null);
    }
    return allResult.value.json()
      .then((data) => (Array.isArray(data) ? data : null))
      .catch(() => null);
  }
}
