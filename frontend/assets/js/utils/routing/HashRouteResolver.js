import Router from './Router.js';
import HashQueryParams from './HashQueryParams.js';
import getCurrentHash from './currentHash.js';

/**
 * Ordered `[path, key]` route table registered on every resolver instance.
 *
 * @type {Array<Array<string>>}
 */
const ROUTES = [
  ['/miniatures/stl_models/new', 'stlModelNew'],
  ['/miniatures/stl_models/:id/edit', 'stlModelEdit'],
  ['/miniatures/stl_models/:id', 'stlModel'],
  ['/miniatures/stl_models', 'stlModels'],
  ['/miniatures/sources/:id', 'source'],
  ['/miniatures/sources', 'sources'],
  ['/miniatures/collections/:id', 'collection'],
  ['/miniatures/collections', 'collections'],
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
  ['/games/:game_slug/npcs/:character_id/items/:id/edit', 'npcCharacterItemEdit'],
  ['/games/:game_slug/npcs/:character_id/items/:id', 'npcCharacterItem'],
  ['/games/:game_slug/npcs/:character_id/items', 'npcCharacterItems'],
  ['/games/:game_slug/npcs/:character_id/possessions/new', 'npcCharacterPossessionNew'],
  ['/games/:game_slug/npcs/:character_id/possessions/:id/edit', 'npcCharacterPossessionEdit'],
  ['/games/:game_slug/npcs/:character_id/possessions/:id', 'npcCharacterPossession'],
  ['/games/:game_slug/npcs/:character_id/possessions', 'npcCharacterPossessions'],
  ['/games/:game_slug/npcs/:character_id/documents/:id', 'npcCharacterDocument'],
  ['/games/:game_slug/npcs/:character_id/documents', 'npcCharacterDocuments'],
  ['/games/:game_slug/npcs/:character_id/factions', 'npcCharacterFactions'],
  ['/games/:game_slug/npcs/:character_id/photos', 'npcCharacterPhotos'],
  ['/games/:game_slug/npcs/:character_id/edit', 'npcCharacterEdit'],
  ['/games/:game_slug/npcs/new', 'gameNpcNew'],
  ['/games/:game_slug/npcs/:character_id', 'npcCharacter'],
  ['/games/:game_slug/pcs/:character_id/treasures', 'pcCharacterTreasures'],
  ['/games/:game_slug/pcs/:character_id/items/new', 'pcCharacterItemNew'],
  ['/games/:game_slug/pcs/:character_id/items/:id/edit', 'pcCharacterItemEdit'],
  ['/games/:game_slug/pcs/:character_id/items/:id', 'pcCharacterItem'],
  ['/games/:game_slug/pcs/:character_id/items', 'pcCharacterItems'],
  ['/games/:game_slug/pcs/:character_id/possessions/new', 'pcCharacterPossessionNew'],
  ['/games/:game_slug/pcs/:character_id/possessions/:id/edit', 'pcCharacterPossessionEdit'],
  ['/games/:game_slug/pcs/:character_id/possessions/:id', 'pcCharacterPossession'],
  ['/games/:game_slug/pcs/:character_id/possessions', 'pcCharacterPossessions'],
  ['/games/:game_slug/pcs/:character_id/documents/:id', 'pcCharacterDocument'],
  ['/games/:game_slug/pcs/:character_id/documents', 'pcCharacterDocuments'],
  ['/games/:game_slug/pcs/:character_id/factions', 'pcCharacterFactions'],
  ['/games/:game_slug/pcs/:character_id/photos', 'pcCharacterPhotos'],
  ['/games/:game_slug/pcs/:character_id/edit', 'pcCharacterEdit'],
  ['/games/:game_slug/pcs/:character_id', 'pcCharacter'],
  ['/games/:game_slug/pcs', 'gamePcs'],
  ['/games/:game_slug/npcs', 'gameNpcs'],
  ['/games/:game_slug/players/:id', 'gamePlayer'],
  ['/games/:game_slug/players', 'gamePlayers'],
  ['/games/:game_slug/treasures/new', 'gameTreasureNew'],
  ['/games/:game_slug/treasures/:treasure_id/edit', 'gameTreasureEdit'],
  ['/games/:game_slug/treasures/:treasure_id', 'gameTreasure'],
  ['/games/:game_slug/treasures', 'gameTreasures'],
  ['/games/:game_slug/items/new', 'gameItemNew'],
  ['/games/:game_slug/items/:id/edit', 'gameItemEdit'],
  ['/games/:game_slug/items/:id', 'gameItem'],
  ['/games/:game_slug/items', 'gameItems'],
  ['/games/:game_slug/possessions/new', 'gamePossessionNew'],
  ['/games/:game_slug/possessions/:id/edit', 'gamePossessionEdit'],
  ['/games/:game_slug/possessions/:id', 'gamePossession'],
  ['/games/:game_slug/possessions', 'gamePossessions'],
  ['/games/:game_slug/factions/:id/edit', 'gameFactionEdit'],
  ['/games/:game_slug/factions/:id', 'gameFaction'],
  ['/games/:game_slug/factions', 'gameFactions'],
  ['/games/:game_slug/documents/new', 'gameDocumentNew'],
  ['/games/:game_slug/documents/:id/edit', 'gameDocumentEdit'],
  ['/games/:game_slug/documents/:id/photos', 'gameDocumentPhotos'],
  ['/games/:game_slug/documents/:id/files', 'gameDocumentFiles'],
  ['/games/:game_slug/documents/:id', 'gameDocument'],
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
  ['/account/authorization_requests', 'accountAuthorizationRequests'],
  ['/my_account', 'myAccount'],
  ['/my-games', 'myGames'],
  ['/', 'home'],
];

/**
 * Query keys read from the hash by {@link HashRouteResolver#getFilterParams}.
 *
 * @type {Array<string>}
 */
const FILTER_KEYS = [
  'public_slain', 'private_slain', 'name', 'public_allegiance', 'private_allegiance', 'status',
  'hidden', 'game_type', 'min_value', 'max_value', 'search',
  'type', 'race', 'roles', 'source', 'collection', 'tags', 'size',
];

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
   * Return NPC/poll/treasure/STL model filter query params from hash.
   *
   * @description Every value present in the hash's `URLSearchParams` for a given key is
   *   preserved (via `.getAll()`/`.append()`), not collapsed to the last one — required for the
   *   STL model filters bar's multi-value fields (`race`/`roles`/`source`/`collection`/`tags`),
   *   passed as repeated query params (e.g. `?race=elf&race=orc`). Scalar-only callers reading a
   *   single key via `.get()` are unaffected, since `.get()` already returns just the first value.
   * @returns {URLSearchParams} Filter params (`public_slain`/`private_slain`/`name`/
   *   `public_allegiance`/`private_allegiance`/`status`/`hidden`/`game_type`/`min_value`/
   *   `max_value`/`search`/`type`/`race`/`roles`/`source`/`collection`/`tags`/`size`), only set
   *   when present in hash.
   */
  getFilterParams() {
    const query = HashQueryParams.parse(this.currentHash());
    const params = new URLSearchParams();

    FILTER_KEYS.forEach((key) => {
      query.getAll(key).forEach((value) => params.append(key, value));
    });

    return params;
  }
}
