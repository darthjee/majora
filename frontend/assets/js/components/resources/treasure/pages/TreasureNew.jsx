import { useEffect, useMemo, useState } from 'react';
import TreasureNewController from './controllers/TreasureNewController.js';
import TreasureNewHelper from './helpers/TreasureNewHelper.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import Noop from '../../../../utils/Noop.js';

/**
 * Treasure creation page.
 *
 * @returns {React.ReactElement} Treasure creation page element.
 */
export default function TreasureNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [gameType, setGameType] = useState('dnd');
  const [showValueModal, setShowValueModal] = useState(false);

  const controller = useMemo(
    () => new TreasureNewController(Noop.noop, setFieldErrors),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, value, gameType },
    { setStatus, setFieldErrors },
  );

  return (
    <>
      {TreasureNewHelper.render(
        {
          name, value, gameType, status, fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onOpenValueModal: () => setShowValueModal(true),
          onGameTypeChange: (event) => setGameType(event.target.value),
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
