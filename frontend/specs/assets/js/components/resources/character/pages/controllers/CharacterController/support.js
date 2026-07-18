import CharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

/**
 * Minimal concrete subclass used to exercise CharacterController logic.
 * The abstract fetch hooks are implemented as plain methods so Jasmine
 * can spy on them.
 */
export class StubCharacterController extends CharacterController {
  constructor(setCharacter, setLoading, setError, paramsFromHash, characterClient) {
    super(setCharacter, setLoading, setError, null, paramsFromHash, characterClient);
  }

  fetchCharacter(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }

  fetchCharacterFull(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }

  fetchCharacterTreasures(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }

  fetchCharacterItems(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }

  fetchCharacterPhotos(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }

  fetchGame(gameSlug, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }
}

export const safeSet = (setter, value) => setter(value);

/**
 * @description Builds a StubCharacterController wired with the given overrides.
 * @param {Function} setCharacter - setter for the loaded character.
 * @param {object} overrides - fake implementations for the fetch hooks.
 * @returns {StubCharacterController} the built controller.
 */
export const buildController = (setCharacter, overrides = {}) => {
  const controller = new StubCharacterController(
    setCharacter,
    Noop.noop,
    Noop.noop,
    () => ({ game_slug: 'demo', character_id: '2' }),
    null,
  );

  if (overrides.fetchCharacter) {
    spyOn(controller, 'fetchCharacter').and.callFake(overrides.fetchCharacter);
  }
  if (overrides.fetchCharacterFull) {
    spyOn(controller, 'fetchCharacterFull').and.callFake(overrides.fetchCharacterFull);
  }
  if (overrides.fetchCharacterTreasures) {
    spyOn(controller, 'fetchCharacterTreasures').and.callFake(overrides.fetchCharacterTreasures);
  }
  if (overrides.fetchCharacterItems) {
    spyOn(controller, 'fetchCharacterItems').and.callFake(overrides.fetchCharacterItems);
  }
  if (overrides.fetchCharacterPhotos) {
    spyOn(controller, 'fetchCharacterPhotos').and.callFake(overrides.fetchCharacterPhotos);
  }
  if (overrides.fetchGame) {
    spyOn(controller, 'fetchGame').and.callFake(overrides.fetchGame);
  }

  return controller;
};
