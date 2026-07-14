import GenericClient from '../../../../../client/GenericClient.js';
import CharacterClient from '../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Controller for game NPCs page.
 */
export default class GameNpcsController extends BasePageController {
  /**
   * Extract game slug from NPCs hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromNpcsHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/npcs', 'game_slug', hash);
  }

  /**
   * Build the hash URL for applying NPC filters, resetting pagination to page 1.
   *
   * @param {string} basePath - Base hash path (e.g. `#/games/demo/npcs`).
   * @param {{slain?: string, name?: string}} filters - Filters to apply, as built by
   *   `NpcFiltersController#buildQuery` (blank fields already omitted).
   * @returns {string} Hash including the reset page and the active filters.
   */
  static buildFilterQueryHash(basePath, filters) {
    const params = new URLSearchParams({ page: '1', ...filters });
    return `${basePath}?${params.toString()}`;
  }

  /**
   * Create a game NPCs controller.
   *
   * @param {Function} setNpcs - NPCs setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {CharacterClient|null} characterClient - Character client override.
   * @param {Function} [setCanEdit] - Can-edit flag setter, gates the "New NPC" button.
   * @param {Function} [setIsPlayer] - Is-player flag setter, gates the player-facing
   *   slain/revive button on each NPC card.
   */
  constructor(
    setNpcs,
    setPagination,
    setLoading,
    setError,
    client = null,
    characterClient = null,
    setCanEdit = Noop.noop,
    setIsPlayer = Noop.noop,
  ) {
    super();
    this.setNpcs = setNpcs;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
    this.setCanEdit = setCanEdit;
    this.setIsPlayer = setIsPlayer;
    this.hashResolver = new HashRouteResolver(() => this.client.currentHash());
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
      const gameSlug = GameNpcsController.getGameSlugFromNpcsHash(this.client.currentHash());

      if (!gameSlug) {
        safeSet(this.setError, 'Unable to load NPCs.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchAccess(gameSlug, safeSet);
        this.#fetchNpcs(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchAccess(gameSlug, safeSet) {
    Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ])
      .then(([access, permissions]) => {
        safeSet(this.setCanEdit, Boolean(permissions.can_edit));
        safeSet(this.setIsPlayer, Boolean(access.is_player));
      })
      .catch(() => {
        safeSet(this.setCanEdit, false);
        safeSet(this.setIsPlayer, false);
      });
  }

  #fetchNpcs(gameSlug, safeSet) {
    const token = AuthStorage.getToken();
    const paginationParams = Object.fromEntries(this.hashResolver.getPaginationParams());
    const filterParams = Object.fromEntries(this.hashResolver.getFilterParams());
    const publicFetch = this.client.fetchIndex(`/games/${gameSlug}/npcs.json`, filterParams);
    const allFetch = token
      ? this.characterClient.fetchNpcsAll(gameSlug, token, { ...paginationParams, ...filterParams })
      : Promise.resolve(null);

    Promise.allSettled([publicFetch, allFetch])
      .then(([publicResult, allResult]) => this.#applyNpcsResult(publicResult, allResult, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load NPCs.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #applyNpcsResult(publicResult, allResult, safeSet) {
    const authResult = await this.#tryGetAuthNpcs(allResult);

    if (authResult !== null) {
      this.#applyAuthNpcs(authResult, safeSet);
      return;
    }

    this.#applyPublicNpcs(publicResult, safeSet);
  }

  #applyPublicNpcs(publicResult, safeSet) {
    if (publicResult.status === 'fulfilled') {
      const { data, pagination } = publicResult.value;
      safeSet(this.setNpcs, Array.isArray(data) ? data : []);
      safeSet(this.setPagination, pagination);
    } else {
      throw new Error('Unable to load NPCs.');
    }
  }

  #applyAuthNpcs(authResult, safeSet) {
    safeSet(this.setNpcs, authResult.npcs);
    safeSet(this.setPagination, authResult.pagination);
  }

  #tryGetAuthNpcs(allResult) {
    if (allResult.status !== 'fulfilled' || !allResult.value?.ok) {
      return Promise.resolve(null);
    }
    const response = allResult.value;
    return response.json()
      .then((data) => (
        Array.isArray(data) ? { npcs: data, pagination: this.#parsePagination(response) } : null
      ))
      .catch(() => null);
  }

  #parsePagination(response) {
    return {
      page: this.#parsePositiveInt(response.headers.get('page'), 1),
      pages: this.#parsePositiveInt(response.headers.get('pages'), 1),
      perPage: this.#parsePositiveInt(response.headers.get('per_page'), 10),
    };
  }

  #parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }
}
