import PcCharacterEditController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import NpcCharacterEditController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';

/**
 * @description Per-character-kind fixtures shared by the CharacterEditController spec files.
 */
export const KINDS = [
  {
    label: 'PcCharacterEditController',
    Controller: PcCharacterEditController,
    kind: 'pcs',
    name: 'Aragorn',
    role: 'Ranger',
    description: 'King',
    getParamsFromHash: PcCharacterEditController.getPcCharacterEditParamsFromHash,
  },
  {
    label: 'NpcCharacterEditController',
    Controller: NpcCharacterEditController,
    kind: 'npcs',
    name: 'Goblin King',
    role: 'Brute',
    description: 'Ruler of the cave',
    getParamsFromHash: NpcCharacterEditController.getNpcCharacterEditParamsFromHash,
    allegiance: 'ally',
    publicAllegiance: 'enemy',
  },
];
