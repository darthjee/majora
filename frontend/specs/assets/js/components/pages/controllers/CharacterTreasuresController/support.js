import PcCharacterTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterTreasuresController.js';
import NpcCharacterTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterTreasuresController.js';

/**
 * @description Per-character-kind fixtures shared by the CharacterTreasuresController spec files.
 */
export const KINDS = [
  {
    label: 'PcCharacterTreasuresController',
    Controller: PcCharacterTreasuresController,
    kind: 'pcs',
    isPc: true,
    money: 310,
    getParamsFromHash: PcCharacterTreasuresController.getPcCharacterTreasuresParamsFromHash,
  },
  {
    label: 'NpcCharacterTreasuresController',
    Controller: NpcCharacterTreasuresController,
    kind: 'npcs',
    isPc: false,
    money: 120,
    getParamsFromHash: NpcCharacterTreasuresController.getNpcCharacterTreasuresParamsFromHash,
  },
];

/**
 * @description Builds a fresh characterClient spy shared by every CharacterTreasuresController spec file.
 * @param {object} overrides - properties to assign onto the built spy object.
 * @returns {object} a characterClient spy with default non-ok fetchCharacter/fetchCharacterAccess.
 */
export function buildCharacterClient(overrides = {}) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterAccess']);

  characterClient.fetchCharacter.and.returnValue(Promise.resolve({ ok: false }));
  characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({ ok: false }));

  return Object.assign(characterClient, overrides);
}
