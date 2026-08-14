import GameTreasureController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js';

/**
 * @description Builds a fresh set of jasmine spy setters shared by every GameTreasureController
 *   spec file.
 * @returns {object} `{setTreasure, setLoading, setError, setCanUploadPhoto, setCanGiveHidden}`.
 */
export function buildSetters() {
  return {
    setTreasure: jasmine.createSpy('setTreasure'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setCanUploadPhoto: jasmine.createSpy('setCanUploadPhoto'),
    setCanGiveHidden: jasmine.createSpy('setCanGiveHidden'),
  };
}

/**
 * @description Builds a `GameTreasureController` from a `buildSetters()` result.
 * @param {object} setters - Setters built by {@link buildSetters}.
 * @returns {GameTreasureController} A fresh controller instance.
 */
export function buildController(setters) {
  return new GameTreasureController(
    setters.setTreasure, setters.setLoading, setters.setError,
    setters.setCanUploadPhoto, setters.setCanGiveHidden,
  );
}

/**
 * @description Runs a `GameTreasureController`'s effect to completion against a given hash,
 *   temporarily stubbing `globalThis.window.location.hash`, then cleans up.
 * @param {string} hash - Hash to simulate as the current location.
 * @param {object} setters - Setters built by {@link buildSetters}.
 * @returns {Promise<void>} Resolves once the effect has settled and been cleaned up.
 */
export async function runController(hash, setters) {
  globalThis.window = { location: { hash } };

  try {
    const cleanup = buildController(setters).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    cleanup();
  } finally {
    delete globalThis.window;
  }
}
