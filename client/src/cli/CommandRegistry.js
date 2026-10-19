/**
 * Actions that take a positional `<id>` (a record id, or the slug for `games get`).
 * @type {string[]}
 */
const ID_ACTIONS = ['get', 'update'];

/**
 * Actions that send a `--data` body.
 * @type {string[]}
 */
const BODY_ACTIONS = ['create', 'update'];

/**
 * Builds the accessor of a game-scoped family.
 * @param {string} family - The family name on `client.game(slug)` (e.g. `npcs`).
 * @returns {Function} `(client, slug) => wrapper`.
 */
function gameFamily(family) {
  return (client, slug) => client.game(slug)[family];
}

/**
 * Every CLI resource: its actions, whether it is game-scoped, a one-line description and the
 * accessor returning the library wrapper.
 * @type {Object<string, {actions: string[], gameScoped: boolean, description: string,
 *   accessor: Function}>}
 */
const RESOURCES = Object.freeze({
  games: {
    actions: ['list', 'mine', 'get'],
    gameScoped: false,
    description: 'Games (top-level, read-only); `get` takes the game slug',
    accessor: (client) => client.games,
  },
  npcs: {
    actions: ['list', 'get', 'create', 'update'],
    gameScoped: true,
    description: 'NPCs of a game',
    accessor: gameFamily('npcs'),
  },
  pcs: {
    actions: ['list', 'get', 'update'],
    gameScoped: true,
    description: 'PCs of a game (no create)',
    accessor: gameFamily('pcs'),
  },
  factions: {
    actions: ['list', 'get', 'create', 'update'],
    gameScoped: true,
    description: 'Factions of a game',
    accessor: gameFamily('factions'),
  },
  items: {
    actions: ['list', 'get', 'create', 'update'],
    gameScoped: true,
    description: 'Items of a game',
    accessor: gameFamily('items'),
  },
  documents: {
    actions: ['list', 'get', 'create', 'update'],
    gameScoped: true,
    description: 'Documents of a game',
    accessor: gameFamily('documents'),
  },
});

/**
 * Declares the CLI commands: per resource, the allowed actions, whether it is game-scoped
 * and how to reach the library wrapper. It is the single source for the argument checks and
 * the help text.
 */
export class CommandRegistry {
  /**
   * The resource names, in help order.
   * @returns {string[]} The names.
   */
  static resourceNames() {
    return Object.keys(RESOURCES);
  }

  /**
   * Tells whether a resource exists.
   * @param {string} resource - The resource name.
   * @returns {boolean} `true` when it is a CLI resource.
   */
  static hasResource(resource) {
    return typeof resource === 'string' && Object.hasOwn(RESOURCES, resource);
  }

  /**
   * The definition of a resource.
   * @param {string} resource - The resource name.
   * @returns {{actions: string[], gameScoped: boolean, description: string}|null} The
   *   definition, or `null` when the resource does not exist.
   */
  static resource(resource) {
    if (!CommandRegistry.hasResource(resource)) {
      return null;
    }

    const { actions, gameScoped, description } = RESOURCES[resource];

    return { actions: [...actions], gameScoped, description };
  }

  /**
   * Tells whether a resource supports an action.
   * @param {string} resource - The resource name.
   * @param {string} action - The action name.
   * @returns {boolean} `true` when the action is allowed.
   */
  static hasAction(resource, action) {
    return CommandRegistry.hasResource(resource) && RESOURCES[resource].actions.includes(action);
  }

  /**
   * Tells whether a resource is game-scoped (needs `--game` / `MAJORA_GAME`).
   * @param {string} resource - The resource name.
   * @returns {boolean} `true` when it is game-scoped.
   */
  static isGameScoped(resource) {
    return CommandRegistry.hasResource(resource) && RESOURCES[resource].gameScoped;
  }

  /**
   * Tells whether an action takes a positional `<id>`.
   * @param {string} action - The action name.
   * @returns {boolean} `true` for `get` and `update`.
   */
  static needsId(action) {
    return ID_ACTIONS.includes(action);
  }

  /**
   * Tells whether an action sends a `--data` body.
   * @param {string} action - The action name.
   * @returns {boolean} `true` for `create` and `update`.
   */
  static takesBody(action) {
    return BODY_ACTIONS.includes(action);
  }

  /**
   * Returns the library wrapper of a resource.
   * @param {string} resource - The resource name.
   * @param {import('../MajoraClient.js').MajoraClient} client - The client.
   * @param {string} [game] - The game slug, for game-scoped resources.
   * @returns {object} The wrapper (`client.games` or `client.game(slug).<family>`).
   * @throws {Error} When the resource does not exist.
   */
  static wrapper(resource, client, game) {
    if (!CommandRegistry.hasResource(resource)) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    return RESOURCES[resource].accessor(client, game);
  }
}
