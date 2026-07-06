import NpcCharacterController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';

/**
 * @description Builds an NpcCharacterController wired for buildEffect() specs.
 * @param {Function} setCharacter - setter for the loaded character.
 * @param {Function} setLoading - setter for the loading flag.
 * @param {Function} setError - setter for the error message.
 * @param {object} client - route/hash client.
 * @param {object} characterClient - character API client.
 * @returns {NpcCharacterController} the built controller.
 */
export const buildEffectController = (setCharacter, setLoading, setError, client, characterClient) => (
  new NpcCharacterController(
    setCharacter, setLoading, setError, client, NpcCharacterController.getNpcCharacterParamsFromHash, characterClient,
  )
);
