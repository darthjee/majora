import { useEffect, useMemo, useState } from 'react';
import GameTreasureNewController from './controllers/GameTreasureNewController.js';
import GameTreasureNewHelper from './helpers/GameTreasureNewHelper.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game treasure creation page.
 *
 * @returns {React.ReactElement} Game treasure creation page element.
 */
export default function GameTreasureNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [gameType, setGameType] = useState('dnd');
  const [showValueModal, setShowValueModal] = useState(false);

  const controller = useMemo(
    () => new GameTreasureNewController(Noop.noop, setFieldErrors, null, setGameType),
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameTreasureNewController.getGameSlugFromTreasureNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, value },
    { setStatus, setFieldErrors },
  );

  return (
    <>
      {GameTreasureNewHelper.render(
        {
          name, value, gameType, status, fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onOpenValueModal: () => setShowValueModal(true),
        },
      )}
      <MoneyEditModal
        show={showValueModal}
        money={value}
        context="treasure"
        gameType={gameType}
        onClose={() => setShowValueModal(false)}
        onConfirm={(newTotal) => {
          setValue(String(newTotal));
          setShowValueModal(false);
        }}
      />
    </>
  );
}
