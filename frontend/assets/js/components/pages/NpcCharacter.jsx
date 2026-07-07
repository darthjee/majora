import { useMemo, useState } from 'react';
import CharacterDetail from './shared/CharacterDetail.jsx';
import NpcCharacterController from './controllers/NpcCharacterController.js';
import AuthStorage from '../../utils/AuthStorage.js';
import SlainConfirmModal from '../elements/SlainConfirmModal.jsx';
import SlainConfirmController from '../elements/controllers/SlainConfirmController.js';

/**
 * NPC-only extension hook plugging the slain confirmation modal into the
 * shared character detail page.
 *
 * @param {object|null} character - Loaded character, or null while still loading.
 * @param {import('./controllers/NpcCharacterController.js').default} controller - Detail controller,
 *   whose effect is re-run to refresh the character after toggling slain state.
 * @returns {{handlers: {onOpenSlainModal: Function}, modal: React.ReactElement|null}} Extra
 *   handlers and modal for the shared detail page.
 */
function useSlainExtra(character, controller) {
  const [showSlainModal, setShowSlainModal] = useState(false);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setShowSlainModal(false);
      controller.buildEffect()();
    }),
    [controller],
  );

  const handleConfirmSlain = () => {
    slainController.handleConfirm(character.game_slug, character, AuthStorage.getToken());
  };

  return {
    handlers: { onOpenSlainModal: () => setShowSlainModal(true) },
    modal: character && (
      <SlainConfirmModal
        show={showSlainModal}
        slain={character.slain}
        onCancel={() => setShowSlainModal(false)}
        onConfirm={handleConfirmSlain}
      />
    ),
  };
}

/**
 * NPC character detail page.
 *
 * @returns {React.ReactElement} NPC character detail page element.
 */
export default function NpcCharacter() {
  return (
    <CharacterDetail
      ControllerClass={NpcCharacterController}
      getParamsFromHash={NpcCharacterController.getNpcCharacterParamsFromHash}
      characterKind="npcs"
      useExtra={useSlainExtra}
    />
  );
}
