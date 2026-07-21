import Router from './Router.js';
import HashQueryParams from './HashQueryParams.js';
import getCurrentHash from './currentHash.js';

/**
 * Ordered `[path, key]` route table registered on every resolver instance.
 *
 * @type {Array<Array<string>>}
 */
const ROUTES = [
  ['/treasures/new', 'treasureNew'],
  ['/treasures/:id/edit', 'treasureEdit'],
  ['/treasures/:id', 'treasure'],
  ['/treasures', 'treasures'],
  ['/staff/users/:id/edit', 'staffUserEdit'],
  ['/staff/users/:id', 'staffUser'],
  ['/staff/users', 'staffUsers'],
  ['/staff/dashboard', 'staffDashboard'],
  ['/games/:game_slug/npcs/:character_id/treasures', 'npcCharacterTreasures'],
  ['/games/:game_slug/npcs/:character_id/items/new', 'npcCharacterItemNew'],
  ['/games/:game_slug/npcs/:character_id/items/:id', 'npcCharacterItem'],
  ['/games/:game_slug/npcs/:character_id/items', 'npcCharacterItems'],
  ['/games/:game_slug/npcs/:character_id/documents', 'npcCharacterDocuments'],
  ['/games/:game_slug/npcs/:character_id/photos', 'npcCharacterPhotos'],
  ['/games/:game_slug/npcs/:character_id/edit', 'npcCharacterEdit'],
  ['/games/:game_slug/npcs/new', 'gameNpcNew'],
  ['/games/:game_slug/npcs/:character_id', 'npcCharacter'],
  ['/games/:game_slug/pcs/:character_id/treasures', 'pcCharacterTreasures'],
  ['/games/:game_slug/pcs/:character_id/items/new', 'pcCharacterItemNew'],
  ['/games/:game_slug/pcs/:character_id/items/:id', 'pcCharacterItem'],
  ['/games/:game_slug/pcs/:character_id/items', 'pcCharacterItems'],
  ['/games/:game_slug/pcs/:character_id/documents', 'pcCharacterDocuments'],
  ['/games/:game_slug/pcs/:character_id/photos', 'pcCharacterPhotos'],
  ['/games/:game_slug/pcs/:character_id/edit', 'pcCharacterEdit'],
  ['/games/:game_slug/pcs/:character_id', 'pcCharacter'],
  ['/games/:game_slug/pcs', 'gamePcs'],
  ['/games/:game_slug/npcs', 'gameNpcs'],
  ['/games/:game_slug/players/:id', 'gamePlayer'],
  ['/games/:game_slug/players', 'gamePlayers'],
  ['/games/:game_slug/treasures/new', 'gameTreasureNew'],
  ['/games/:game_slug/treasures/:treasure_id/edit', 'gameTreasureEdit'],
  ['/games/:game_slug/treasures', 'gameTreasures'],
  ['/games/:game_slug/items/:id', 'gameItem'],
  ['/games/:game_slug/items', 'gameItems'],
  ['/games/:game_slug/documents', 'gameDocuments'],
  ['/games/:game_slug/sessions/new', 'gameSessionNew'],
  ['/games/:game_slug/sessions/:id/edit', 'gameSessionEdit'],
  ['/games/:game_slug/sessions/:id', 'gameSession'],
  ['/games/:game_slug/sessions', 'gameSessions'],
  ['/games/:game_slug/tasks', 'gameTasks'],
  ['/games/:game_slug/polls/new', 'gamePollNew'],
  ['/games/:game_slug/polls/:id', 'gamePoll'],
  ['/games/:game_slug/polls', 'gamePolls'],
  ['/games/:game_slug/photos', 'gamePhotos'],
  ['/games/new', 'gameNew'],
  ['/games/:game_slug/edit', 'gameEdit'],
  ['/games/:game_slug', 'game'],
  ['/games', 'games'],
  ['/recover-password', 'recoverPassword'],
  ['/users/register', 'register'],
  ['/my_account', 'myAccount'],
  ['/my-games', 'myGames'],
  ['/', 'home'],
];

/**
 * Query keys read from the hash by {@link HashRouteResolver#getFilterParams}.
 *
 * @type {Array<string>}
 */
const FILTER_KEYS = ['slain', 'name', 'allegiance', 'status', 'hidden', 'game_type', 'min_value', 'max_value'];

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
  constructor(hashProvider = getCurrentHash) {
    this.#hashProvider = hashProvider;
    this.#router = new Router();

    ROUTES.forEach(([path, key]) => this.#router.register(path, key));
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

    FILTER_KEYS.forEach((key) => {
      const value = query.get(key);

      if (value !== null) {
        params.set(key, value);
      }
    });

    return params;
  }
}
