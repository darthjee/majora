/**
 * @description Builds a fresh characterClient spy shared by every NpcCharacterTreasuresController spec file.
 * @param {object} overrides - properties to assign onto the built spy object.
 * @returns {object} a characterClient spy with default non-ok fetchNpc/fetchNpcAccess.
 */
export function buildCharacterClient(overrides = {}) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcAccess']);

  characterClient.fetchNpc.and.returnValue(Promise.resolve({ ok: false }));
  characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({ ok: false }));

  return Object.assign(characterClient, overrides);
}
