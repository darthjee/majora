import CharacterClient from '../../../../../client/CharacterClient.js';
import GenericClient from '../../../../../client/GenericClient.js';
import GameClient from '../../../../../client/GameClient.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import Noop from '../../../../../utils/Noop.js';
import CharacterGameTypeResolver from './CharacterGameTypeResolver.js';
import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Base controller for character treasures index pages (PC and NPC).
 *
 * @description Holds all shared logic for NPC and PC character treasures pages.
 *   Subclasses supply the type-specific hash param extractor and `characterKind`
 *   (`'pcs'` or `'npcs'`), used both as the URL segment and to build the correct
 *   {@link CharacterClient} calls.
 */
export default class BaseCharacterTreasuresController extends BasePageController {
  #mounted = false;

  /**
   * Build the hash URL for applying treasure filters, resetting pagination to page 1.
   *
   * @param {string} basePath - Base hash path (e.g. `#/games/demo/pcs/2/treasures`).
   * @param {{min_value?: string, max_value?: string, name?: string}} filters - Filters to
   *   apply, as built by `TreasureFiltersController#buildQuery` (blank fields already omitted).
   * @returns {string} Hash including the reset page and the active filters.
   */
  static buildFilterQueryHash(basePath, filters) {
    const params = new URLSearchParams({ page: '1', ...filters });
    return `${basePath}?${params.toString()}`;
  }

  /**
   * Create a base character treasures controller.
   *
   * @param {object} setters - Page state setters.
   * @param {Function} setters.setTreasures - Treasures setter.
   * @param {Function} setters.setPagination - Pagination setter.
   * @param {Function} setters.setLoading - Loading setter.
   * @param {Function} setters.setError - Error setter.
   * @param {Function} [setters.setCharacter] - Character context setter, used for the "Add treasure"
   *   button's visibility and the exchange modal's affordability checks.
   * @param {Function} getParamsFromHash - Hash param extractor returning `game_slug`/`character_id`.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {GenericClient|null} [client] - Client override.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {GameClient|null} [gameClient] - Game client override, used to resolve the
   *   character's game currency type.
   */
  constructor(
    setters,
    getParamsFromHash,
    characterKind,
    client = null,
    characterClient = null,
    gameClient = null,
  ) {
    super();
    const { setTreasures, setPagination, setLoading, setError, setCharacter = Noop.noop } = setters;
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.getParamsFromHash = getParamsFromHash;
    this.characterKind = characterKind;
    this.client = client ?? new GenericClient();
    this.setCharacter = setCharacter;
    this.characterClient = characterClient ?? new CharacterClient();
    this.gameClient = gameClient ?? new GameClient();
    this.hashResolver = new HashRouteResolver(() => this.client.currentHash());
    this.#mounted = true;
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
      const { game_slug: gameSlug, character_id: characterId } =
        this.getParamsFromHash(this.client.currentHash());

      if (!gameSlug || !characterId) {
        safeSet(this.setError, 'Unable to load treasures.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchTreasures(gameSlug, characterId, safeSet);
        this.#fetchCharacterData(gameSlug, characterId, safeSet);
      }

      return () => {
        mounted = false;
        this.#mounted = false;
      };
    };
  }

  /**
   * Re-fetch and re-set the character context, without touching the treasures
   * list/pagination. Meant to be called after a successful acquire/sell so the
   * character's money (and any other field) reflects a fresh server read,
   * independent of the effect built by {@link buildEffect}.
   *
   * @returns {void}
   */
  refreshCharacter() {
    const { game_slug: gameSlug, character_id: characterId } =
      this.getParamsFromHash(this.client.currentHash());

    if (!gameSlug || !characterId) {
      return;
    }

    this.#fetchCharacterData(gameSlug, characterId, this.buildSafeSetter(() => this.#mounted));
  }

  #fetchTreasures(gameSlug, characterId, safeSet) {
    if (this.characterKind === 'npcs') {
      this.#fetchNpcTreasures(gameSlug, characterId, safeSet);
      return;
    }

    this.#fetchTreasuresIndex(gameSlug, characterId, safeSet);
  }

  #fetchTreasuresIndex(gameSlug, characterId, safeSet) {
    const filterParams = Object.fromEntries(this.hashResolver.getFilterParams());

    this.client.fetchIndex(
      `/games/${gameSlug}/${this.characterKind}/${characterId}/treasures.json`, filterParams,
    )
      .then(({ data, pagination }) => {
        safeSet(this.setTreasures, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Resolve the viewer's game-level edit permission before deciding which NPC
   * treasures endpoint to fetch: the full, hidden-inclusive `treasures/all.json`
   * for a game editor (DM/staff/superuser), so a hidden treasure already sitting in
   * the NPC's inventory isn't filtered out of its own page, or the regular,
   * hidden-filtered `treasures.json` otherwise. Falls back to the regular
   * endpoint when the permission check itself fails.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - NPC character id.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {void}
   */
  #fetchNpcTreasures(gameSlug, characterId, safeSet) {
    AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => (permissions.can_edit
        ? this.#fetchNpcTreasuresAll(gameSlug, characterId, safeSet)
        : this.#fetchTreasuresIndex(gameSlug, characterId, safeSet)))
      .catch(() => this.#fetchTreasuresIndex(gameSlug, characterId, safeSet));
  }

  #fetchNpcTreasuresAll(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();
    const paginationParams = BaseCharacterTreasuresController.#paginationParamsFromHash(this.client.currentHash());
    const filterParams = Object.fromEntries(this.hashResolver.getFilterParams());
    const params = { ...paginationParams, ...filterParams };

    this.characterClient.fetchTreasuresAllPage(gameSlug, characterId, token, params)
      .then((response) => BaseCharacterTreasuresController.#parsePageResponse(response))
      .then(({ data, pagination }) => {
        safeSet(this.setTreasures, data);
        safeSet(this.setPagination, pagination);
      })
      .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  static #paginationParamsFromHash(hash) {
    const query = HashQueryParams.parse(hash);
    const page = query.get('page');
    const perPage = query.get('per_page');

    return {
      page: page ? Number.parseInt(page, 10) : undefined,
      perPage: perPage ? Number.parseInt(perPage, 10) : undefined,
    };
  }

  static async #parsePageResponse(response) {
    if (!response.ok) {
      throw new Error('Unable to load treasures.');
    }

    const data = await response.json();

    return {
      data: Array.isArray(data) ? data : [],
      pagination: {
        page: BaseCharacterTreasuresController.#parseInt(response.headers.get('page'), 1),
        pages: BaseCharacterTreasuresController.#parseInt(response.headers.get('pages'), 1),
        perPage: BaseCharacterTreasuresController.#parseInt(response.headers.get('per_page'), 10),
      },
    };
  }

  static #parseInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }

  #fetchCharacterData(gameSlug, characterId, safeSet) {
    const token = AuthStorage.getToken();

    this.characterClient.fetchCharacter(this.characterKind, gameSlug, characterId, token)
      .then((response) => (response.ok ? response.json() : null))
      .then((character) => this.#mergeGameType(character, gameSlug, token))
      .then((character) => this.#mergeAccess(character, gameSlug, characterId, safeSet))
      .catch(() => safeSet(this.setCharacter, null));
  }

  #mergeGameType(character, gameSlug, token) {
    if (!character) {
      return character;
    }

    return CharacterGameTypeResolver.merge(character, this.gameClient.fetchGame(gameSlug, token));
  }

  /**
   * Merge both the character-level and game-level edit permissions onto the loaded
   * character before publishing it: `can_edit` (character-level, `true` for the DM,
   * a superuser, or — for a PC — the character's own owning player) still gates
   * character-editing actions like the "Add treasure" button, while `game_can_edit`
   * (game-level, DM/superuser only) drives the treasure exchange modal's choice
   * between the public and `all.json` endpoints. Resolved in parallel to avoid an
   * extra sequential round-trip. Each check falls back to `false` independently if
   * it fails.
   *
   * @param {object|null} character - Character payload, or `null` if it failed to load.
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {Function} safeSet - Setter wrapper guarding against a stale/unmounted update.
   * @returns {Promise<void>} Resolves once the character (with merged permissions) is set.
   */
  #mergeAccess(character, gameSlug, characterId, safeSet) {
    if (!character) {
      safeSet(this.setCharacter, null);
      return Promise.resolve();
    }

    const characterPermissions = AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false);
    const gamePermissions = AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false);

    return Promise.all([characterPermissions, gamePermissions])
      .then(([canEdit, gameCanEdit]) => safeSet(
        this.setCharacter, { ...character, can_edit: canEdit, game_can_edit: gameCanEdit },
      ));
  }
}
