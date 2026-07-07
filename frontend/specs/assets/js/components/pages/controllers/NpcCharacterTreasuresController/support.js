/**
 * @description Builds a fresh characterClient spy shared by every NpcCharacterTreasuresController spec file.
 * @param {object} overrides - properties to assign onto the built spy object.
 * @returns {object} a characterClient spy with default non-ok fetchCharacter/fetchCharacterAccess.
 */
export function buildCharacterClient(overrides = {}) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterAccess']);

  characterClient.fetchCharacter.and.returnValue(Promise.resolve({ ok: false }));
  characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({ ok: false }));

  return Object.assign(characterClient, overrides);
}
