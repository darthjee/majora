import BaseCharacterEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js';
import NpcCharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterController.js';
import NpcCharacterEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterEditController.js';

/**
 * @description Minimal concrete subclass used to exercise BaseCharacterEditController
 * through the Npc load/edit configuration shared by every split spec file.
 */
export class TestCharacterEditController extends BaseCharacterEditController {
  /**
   * @description Builds a controller wired to the Npc character configuration.
   * @param {Function} setCharacter - setter for the loaded character.
   * @param {Function} setLoading - setter for the loading flag.
   * @param {Function} setError - setter for the error message.
   * @param {Function} setFieldErrors - setter for field-level errors.
   * @param {object} client - route/hash client.
   * @param {object} characterClient - character API client.
   */
  constructor(setCharacter, setLoading, setError, setFieldErrors, client, characterClient) {
    super(
      setCharacter, setLoading, setError, setFieldErrors,
      NpcCharacterController, NpcCharacterEditController.getNpcCharacterEditParamsFromHash,
      'npcs', client, characterClient,
    );
  }
}

/**
 * @description Builds fresh spies shared by every BaseCharacterEditController spec file.
 * @returns {object} the setters and client spies used to construct the controller.
 */
export function buildContext() {
  return {
    setCharacter: jasmine.createSpy('setCharacter'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setFieldErrors: jasmine.createSpy('setFieldErrors'),
    client: jasmine.createSpyObj('client', ['currentHash']),
    characterClient: jasmine.createSpyObj(
      'characterClient', ['fetchCharacter', 'updateCharacter', 'updateNpcAsPlayer'],
    ),
  };
}
