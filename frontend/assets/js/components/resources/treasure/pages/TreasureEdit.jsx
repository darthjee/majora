import { useEffect, useMemo, useState } from 'react';
import TreasureEditController from './controllers/TreasureEditController.js';
import TreasureEditHelper from './helpers/TreasureEditHelper.jsx';
import TreasureHelper from './helpers/TreasureHelper.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Treasure edit page.
 *
 * @returns {React.ReactElement} Treasure edit page element.
 */
export default function TreasureEdit() {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showValueModal, setShowValueModal] = useState(false);
  const { state: fields, setField, handleChange } = useFormState({ name: '', value: '' });

  const controller = useMemo(
    () => new TreasureEditController(setTreasure, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const treasureId = TreasureEditController.getTreasureIdFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!treasure) return;

    if (!treasure.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/treasures/${treasureId}`;
      }
      return;
    }

    setField('name', treasure.name ?? '');
    setField('value', treasure.value !== null ? String(treasure.value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasure]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    treasureId,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return TreasureEditHelper.renderLoading();
  if (error) return TreasureHelper.renderError(error);

  return (
    <>
      {TreasureEditHelper.render(
        {
          ...fields, gameType: treasure?.game_type ?? 'dnd', status, fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onOpenValueModal: () => setShowValueModal(true),
        },
      )}
      <MoneyEditModal
        show={showValueModal}
        money={fields.value}
        context="treasure"
        gameType={treasure?.game_type ?? 'dnd'}
        onClose={() => setShowValueModal(false)}
        onConfirm={(newTotal) => {
          setField('value', String(newTotal));
          setShowValueModal(false);
        }}
      />
    </>
  );
}
