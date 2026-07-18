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
   * @param {{slain?: string, name?: string, allegiance?: string, hidden?: string}} filters -
   *   Filters to apply, as built by `NpcFiltersController#buildQuery` (blank fields already
   *   omitted).
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
        this.#loadNpcs(gameSlug, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Resolve the requester's game access (`is_player`, used only to gate the
   * player-facing slain/revive button) and edit permission (facade-aware, so
   * it reflects a "View as" simulated role), then fetch the NPC list from the
   * single endpoint matching that resolved permission.
   *
   * @param {string} gameSlug - Game slug.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {void}
   */
  #loadNpcs(gameSlug, safeSet) {
    Promise.all([
      AccessStore.ensureGameAccess(gameSlug),
      AccessStore.ensureGamePermissions(gameSlug),
    ])
      .then(([access, permissions]) => {
        const canEdit = Boolean(permissions.can_edit);
        safeSet(this.setIsPlayer, Boolean(access.is_player));
        safeSet(this.setCanEdit, canEdit);
        return this.#fetchNpcs(gameSlug, canEdit, safeSet);
      })
      .catch(() => {
        safeSet(this.setIsPlayer, false);
        safeSet(this.setCanEdit, false);
        return this.#fetchNpcs(gameSlug, false, safeSet);
      });
  }

  /**
   * Fetch the NPC list from the single endpoint matching the resolved edit
   * permission: the full catalog (including hidden NPCs) through
   * `npcs/all.json` for an editor, or the player-facing `npcs.json` otherwise.
   *
   * @param {string} gameSlug - Game slug.
   * @param {boolean} canEdit - Whether the requester (or simulated "View as" role) can edit
   *   the game.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {Promise<void>} Resolves once the NPC list request settles.
   */
  #fetchNpcs(gameSlug, canEdit, safeSet) {
    const filterParams = Object.fromEntries(this.hashResolver.getFilterParams());

    if (canEdit) {
      return this.#fetchNpcsAll(gameSlug, filterParams, safeSet);
    }

    return this.client.fetchIndex(`/games/${gameSlug}/npcs.json`, filterParams)
      .then(({ data, pagination }) => {
        safeSet(this.setNpcs, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load NPCs.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  #fetchNpcsAll(gameSlug, filterParams, safeSet) {
    const token = AuthStorage.getToken();
    const paginationParams = Object.fromEntries(this.hashResolver.getPaginationParams());

    return this.characterClient.fetchNpcsAll(gameSlug, token, { ...paginationParams, ...filterParams })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load NPCs.');
        }

        return response.json().then((data) => ({
          data: Array.isArray(data) ? data : [],
          pagination: this.#parsePagination(response),
        }));
      })
      .then(({ data, pagination }) => {
        safeSet(this.setNpcs, data);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load NPCs.'))
      .finally(() => safeSet(this.setLoading, false));
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
