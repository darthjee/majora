/**
 * @description Builds a fresh characterClient spy shared by every PcCharacterTreasuresController spec file.
 * @param {object} overrides - properties to assign onto the built spy object.
 * @returns {object} a characterClient spy with default non-ok fetchPc/fetchPcAccess.
 */
export function buildCharacterClient(overrides = {}) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcAccess']);

  characterClient.fetchPc.and.returnValue(Promise.resolve({ ok: false }));
  characterClient.fetchPcAccess.and.returnValue(Promise.resolve({ ok: false }));

  return Object.assign(characterClient, overrides);
}
