import Router from './Router.js';
import hashQueryParams from './hashQueryParams.js';

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
    this.#router.register('/games/:game_slug/npcs/:character_id/photos', 'npcCharacterPhotos');
    this.#router.register('/games/:game_slug/npcs/:character_id/edit', 'npcCharacterEdit');
    this.#router.register('/games/:game_slug/npcs/:character_id', 'npcCharacter');
    this.#router.register('/games/:game_slug/pcs/:character_id/photos', 'pcCharacterPhotos');
    this.#router.register('/games/:game_slug/pcs/:character_id/edit', 'pcCharacterEdit');
    this.#router.register('/games/:game_slug/pcs/:character_id', 'pcCharacter');
    this.#router.register('/games/:game_slug/pcs', 'gamePcs');
    this.#router.register('/games/:game_slug/npcs', 'gameNpcs');
    this.#router.register('/games/:game_slug/treasures', 'gameTreasures');
    this.#router.register('/games/:game_slug/sessions/new', 'gameSessionNew');
    this.#router.register('/games/:game_slug/sessions/:id/edit', 'gameSessionEdit');
    this.#router.register('/games/:game_slug/sessions/:id', 'gameSession');
    this.#router.register('/games/:game_slug/sessions', 'gameSessions');
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
   * Return pagination query params from hash.
   *
   * @returns {URLSearchParams} Pagination params.
   */
  getPaginationParams() {
    const query = hashQueryParams(this.currentHash());
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
}
