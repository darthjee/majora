import PcCharacterPhotosController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterPhotosController.js';
import NpcCharacterPhotosController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterPhotosController.js';

/**
 * @description Per-character-kind fixtures shared by the CharacterPhotosController spec files,
 *   pairing each concrete controller with its kind-specific route segment and hash parser.
 */
export const KINDS = [
  {
    label: 'PcCharacterPhotosController',
    Controller: PcCharacterPhotosController,
    kind: 'pcs',
    getParamsFromHash: PcCharacterPhotosController.getPcCharacterPhotosParamsFromHash,
  },
  {
    label: 'NpcCharacterPhotosController',
    Controller: NpcCharacterPhotosController,
    kind: 'npcs',
    getParamsFromHash: NpcCharacterPhotosController.getNpcCharacterPhotosParamsFromHash,
  },
];

/**
 * @description Builds a fresh characterClient spy shared by every CharacterPhotosController spec file.
 * @returns {object} a characterClient spy with default successful fetchCharacter/setPhotoRoles.
 */
export function buildCharacterClient() {
  const characterClient = jasmine.createSpyObj(
    'characterClient', ['fetchCharacter', 'setPhotoRoles'],
  );
  characterClient.fetchCharacter.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Aragorn' }),
  }));
  characterClient.setPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
  return characterClient;
}
