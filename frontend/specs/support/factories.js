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
    profile_photo_path: null,
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
