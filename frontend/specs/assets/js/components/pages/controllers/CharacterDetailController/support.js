import PcCharacterController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterController.js';
import NpcCharacterController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';

/**
 * @description Per-character-kind fixtures shared by the CharacterDetailController spec files
 *   (covering the PcCharacterController/NpcCharacterController detail-page controllers).
 */
export const KINDS = [
  {
    label: 'PcCharacterController',
    Controller: PcCharacterController,
    kind: 'pcs',
    privateDescription: 'Secret notes.',
    getParamsFromHash: PcCharacterController.getPcCharacterParamsFromHash,
  },
  {
    label: 'NpcCharacterController',
    Controller: NpcCharacterController,
    kind: 'npcs',
    privateDescription: 'Secret lore.',
    getParamsFromHash: NpcCharacterController.getNpcCharacterParamsFromHash,
  },
];
