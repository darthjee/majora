import PcCharacterController, { getPcCharacterParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterController.js';

/**
 * @description Builds a PcCharacterController wired for buildEffect() specs.
 * @param {Function} setCharacter - setter for the loaded character.
 * @param {Function} setLoading - setter for the loading flag.
 * @param {Function} setError - setter for the error message.
 * @param {object} client - route/hash client.
 * @param {object} characterClient - character API client.
 * @returns {PcCharacterController} the built controller.
 */
export const buildEffectController = (setCharacter, setLoading, setError, client, characterClient) => (
  new PcCharacterController(
    setCharacter, setLoading, setError, client, getPcCharacterParamsFromHash, characterClient,
  )
);
