/**
 * Test object factories for Jasmine tests.
 * Provides factory functions to create mock data objects.
 */

/**
 * Create a mock game object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock game object.
 */
export function buildGame(overrides = {}) {
  return {
    name: 'Test Game',
    game_slug: 'test-game',
    links: [],
    ...overrides,
  };
}

/**
 * Create a mock character object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock character object.
 */
export function buildCharacter(overrides = {}) {
  return {
    id: 1,
    name: 'Test Character',
    photo_path: null,
    role: null,
    public_description: '',
    is_pc: false,
    photos: [],
    ...overrides,
  };
}

/**
 * Create a mock link object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock link object.
 */
export function buildLink(overrides = {}) {
  return {
    id: 1,
    text: 'Test Link',
    url: 'http://example.com',
    ...overrides,
  };
}

/**
 * Create a mock treasure object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock treasure object.
 */
export function buildTreasure(overrides = {}) {
  return {
    id: 1,
    name: 'Golden Crown',
    value: 500,
    photo_path: null,
    ...overrides,
  };
}

/**
 * Create a mock STL model object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock STL model object.
 */
export function buildStlModel(overrides = {}) {
  return {
    id: 1,
    name: 'Goblin Miniature',
    photo_url: null,
    owned: true,
    type: 'creature',
    race: null,
    role: null,
    links: [],
    sources: [],
    collections: [],
    tags: [],
    ...overrides,
  };
}

/**
 * Create a mock source object.
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock source object.
 */
export function buildSource(overrides = {}) {
  return {
    id: 1,
    name: 'MyMiniFactory',
    url: '',
    photo_url: null,
    ...overrides,
  };
}

/**
 * Create a mock collection object, covering both the list serializer shape
 * (`id`/`name`/`photo_url`/`stl_model_count`) and the detail serializer shape
 * (`id`/`name`/`url`/`photo_url`/`source`/`stl_models`).
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock collection object.
 */
export function buildCollection(overrides = {}) {
  return {
    id: 1,
    name: 'Goblin Pack',
    url: '',
    photo_url: null,
    stl_model_count: 0,
    source: null,
    stl_models: [],
    ...overrides,
  };
}

/**
 * Create a mock faction object (issue #812).
 *
 * @param {object} overrides - Properties to override the defaults.
 * @returns {object} A mock faction object.
 */
export function buildFaction(overrides = {}) {
  return {
    id: 1,
    name: 'The Silver Hand',
    photo_path: null,
    ...overrides,
  };
}
