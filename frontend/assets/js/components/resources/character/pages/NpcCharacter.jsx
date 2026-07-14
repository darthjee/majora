import { useMemo, useState } from 'react';
import CharacterDetail from './shared/CharacterDetail.jsx';
import NpcCharacterController from './controllers/NpcCharacterController.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import SlainConfirmModal from './elements/SlainConfirmModal.jsx';
import SlainConfirmController from './elements/controllers/SlainConfirmController.js';
import PlayerSlainConfirmController from './elements/controllers/PlayerSlainConfirmController.js';

/**
 * Builds the show/hide state, controller, and confirm handler for a single
 * slain-toggle field (real or public), plugging into the shared character
 * detail page's refresh effect.
 *
 * @param {'slain'|'public_slain'} field - Character field this pair toggles.
 * @param {object|null} character - Loaded character, or null while still loading.
 * @param {import('./controllers/NpcCharacterController.js').default} controller - Detail controller,
 *   whose effect is re-run to refresh the character after toggling.
 * @returns {{show: boolean, open: Function, close: Function, confirm: Function}} Modal
 *   visibility state and handlers for this field.
 */
function useSlainTogglePair(field, character, controller) {
  const [show, setShow] = useState(false);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setShow(false);
      controller.buildEffect()();
    }, field),
    [controller, field],
  );

  const confirm = () => {
    slainController.handleConfirm(character.game_slug, character, AuthStorage.getToken());
  };

  return {
    show, open: () => setShow(true), close: () => setShow(false), confirm,
  };
}

/**
 * Builds the show/hide state and confirm handler for the player-facing slain
 * toggle, which PATCHes the plain NPC endpoint as a player of the game
 * (rather than the DM's `full.json` endpoint used by {@link useSlainTogglePair}).
 *
 * @param {object|null} character - Loaded character, or null while still loading.
 * @param {import('./controllers/NpcCharacterController.js').default} controller - Detail controller,
 *   whose effect is re-run to refresh the character after toggling.
 * @returns {{show: boolean, open: Function, close: Function, confirm: Function}} Modal
 *   visibility state and handlers for the player-facing toggle.
 */
function usePlayerSlainToggle(character, controller) {
  const [show, setShow] = useState(false);

  const playerSlainController = useMemo(
    () => new PlayerSlainConfirmController(() => {
      setShow(false);
      controller.buildEffect()();
    }),
    [controller],
  );

  const confirm = () => {
    playerSlainController.handleConfirm(character.game_slug, character, AuthStorage.getToken());
  };

  return {
    show, open: () => setShow(true), close: () => setShow(false), confirm,
  };
}

/**
 * NPC-only extension hook plugging the real, public, and player-facing slain
 * confirmation modals into the shared character detail page.
 *
 * @param {object|null} character - Loaded character, or null while still loading.
 * @param {import('./controllers/NpcCharacterController.js').default} controller - Detail controller,
 *   whose effect is re-run to refresh the character after toggling slain state.
 * @returns {{handlers: {onOpenSlainModal: Function, onOpenPublicSlainModal: Function,
 *   onOpenPlayerSlainModal: Function}, modal: React.ReactElement|null}} Extra handlers and
 *   modals for the shared detail page.
 */
function useSlainExtra(character, controller) {
  const slain = useSlainTogglePair('slain', character, controller);
  const publicSlain = useSlainTogglePair('public_slain', character, controller);
  const playerSlain = usePlayerSlainToggle(character, controller);

  return {
    handlers: {
      onOpenSlainModal: slain.open,
      onOpenPublicSlainModal: publicSlain.open,
      onOpenPlayerSlainModal: playerSlain.open,
    },
    modal: character && (
      <>
        <SlainConfirmModal
          show={slain.show}
          slain={character.slain}
          onCancel={slain.close}
          onConfirm={slain.confirm}
        />
        <SlainConfirmModal
          show={publicSlain.show}
          slain={character.public_slain}
          isPublic
          onCancel={publicSlain.close}
          onConfirm={publicSlain.confirm}
        />
        <SlainConfirmModal
          show={playerSlain.show}
          slain={character.slain}
          onCancel={playerSlain.close}
          onConfirm={playerSlain.confirm}
        />
      </>
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
