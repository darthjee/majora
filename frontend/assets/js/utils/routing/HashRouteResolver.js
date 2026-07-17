import Router from './Router.js';
import HashQueryParams from './HashQueryParams.js';

/**
 * Resolver for hash-based application routes.
 */
export default class HashRouteResolver {
  #hashProvider;

  #router;

  /**
   * Build a resolver instance.
   *
   * @param {Function} hashProvider - Function returning current hash.
   */
  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
    this.#router = new Router();

    this.#router.register('/treasures/new', 'treasureNew');
    this.#router.register('/treasures/:id/edit', 'treasureEdit');
    this.#router.register('/treasures/:id', 'treasure');
    this.#router.register('/treasures', 'treasures');
    this.#router.register('/staff/users/:id/edit', 'staffUserEdit');
    this.#router.register('/staff/users/:id', 'staffUser');
    this.#router.register('/staff/users', 'staffUsers');
    this.#router.register('/games/:game_slug/npcs/:character_id/treasures', 'npcCharacterTreasures');
    this.#router.register('/games/:game_slug/npcs/:character_id/photos', 'npcCharacterPhotos');
    this.#router.register('/games/:game_slug/npcs/:character_id/edit', 'npcCharacterEdit');
    this.#router.register('/games/:game_slug/npcs/new', 'gameNpcNew');
    this.#router.register('/games/:game_slug/npcs/:character_id', 'npcCharacter');
    this.#router.register('/games/:game_slug/pcs/:character_id/treasures', 'pcCharacterTreasures');
    this.#router.register('/games/:game_slug/pcs/:character_id/photos', 'pcCharacterPhotos');
    this.#router.register('/games/:game_slug/pcs/:character_id/edit', 'pcCharacterEdit');
    this.#router.register('/games/:game_slug/pcs/:character_id', 'pcCharacter');
    this.#router.register('/games/:game_slug/pcs', 'gamePcs');
    this.#router.register('/games/:game_slug/npcs', 'gameNpcs');
    this.#router.register('/games/:game_slug/treasures/new', 'gameTreasureNew');
    this.#router.register('/games/:game_slug/treasures/:treasure_id/edit', 'gameTreasureEdit');
    this.#router.register('/games/:game_slug/treasures', 'gameTreasures');
    this.#router.register('/games/:game_slug/sessions/new', 'gameSessionNew');
    this.#router.register('/games/:game_slug/sessions/:id/edit', 'gameSessionEdit');
    this.#router.register('/games/:game_slug/sessions/:id', 'gameSession');
    this.#router.register('/games/:game_slug/sessions', 'gameSessions');
    this.#router.register('/games/:game_slug/tasks', 'gameTasks');
    this.#router.register('/games/:game_slug/polls/new', 'gamePollNew');
    this.#router.register('/games/:game_slug/polls/:id', 'gamePoll');
    this.#router.register('/games/:game_slug/polls', 'gamePolls');
    this.#router.register('/games/:game_slug/photos', 'gamePhotos');
    this.#router.register('/games/new', 'gameNew');
    this.#router.register('/games/:game_slug/edit', 'gameEdit');
    this.#router.register('/games/:game_slug', 'game');
    this.#router.register('/games', 'games');
    this.#router.register('/recover-password', 'recoverPassword');
    this.#router.register('/users/register', 'register');
    this.#router.register('/my_account', 'myAccount');
    this.#router.register('/', 'home');
  }

  /**
   * Return the current hash.
   *
   * @returns {string} Current hash value.
   */
  currentHash() {
    return this.#hashProvider();
  }

  /**
   * Resolve the current hash into a page key.
   *
   * @returns {string} Page identifier.
   */
  getPage() {
    const route = this.currentHash().split('?')[0].replace(/^#/, '');
    return this.#router.resolve(route || '/');
  }

  /**
   * Extract route params for the given path pattern from the current hash.
   *
   * @param {string} path - Route pattern to parse (e.g. '/games/:game_slug').
   * @returns {object} Route params map.
   */
  getParams(path) {
    return Router.extractParams(path, this.currentHash());
  }

  /**
   * Return pagination query params from hash.
   *
   * @returns {URLSearchParams} Pagination params.
   */
  getPaginationParams() {
    const query = HashQueryParams.parse(this.currentHash());
    const params = new URLSearchParams();

    const page = query.get('page');
    const perPage = query.get('per_page');

    if (page !== null) {
      params.set('page', page);
    }

    if (perPage !== null) {
      params.set('per_page', perPage);
    }

    return params;
  }

  /**
   * Return NPC/poll/treasure filter query params from hash.
   *
   * @returns {URLSearchParams} Filter params (`slain`/`name`/`allegiance`/`status`/`hidden`/
   *   `game_type`/`min_value`/`max_value`), only set when present in hash.
   */
  getFilterParams() {
    const query = HashQueryParams.parse(this.currentHash());
    const params = new URLSearchParams();

    const slain = query.get('slain');
    const name = query.get('name');
    const allegiance = query.get('allegiance');
    const status = query.get('status');
    const hidden = query.get('hidden');
    const gameType = query.get('game_type');
    const minValue = query.get('min_value');
    const maxValue = query.get('max_value');

    if (slain !== null) {
      params.set('slain', slain);
    }

    if (name !== null) {
      params.set('name', name);
    }

    if (allegiance !== null) {
      params.set('allegiance', allegiance);
    }

    if (status !== null) {
      params.set('status', status);
    }

    if (hidden !== null) {
      params.set('hidden', hidden);
    }

    if (gameType !== null) {
      params.set('game_type', gameType);
    }

    if (minValue !== null) {
      params.set('min_value', minValue);
    }

    if (maxValue !== null) {
      params.set('max_value', maxValue);
    }

    return params;
  }
}
