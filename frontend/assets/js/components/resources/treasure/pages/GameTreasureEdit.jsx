import { useEffect, useMemo, useState } from 'react';
import GameTreasureEditController from './controllers/GameTreasureEditController.js';
import GameTreasureEditHelper from './helpers/GameTreasureEditHelper.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game treasure edit page.
 *
 * @returns {React.ReactElement} Game treasure edit page element.
 */
export default function GameTreasureEdit() {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showValueModal, setShowValueModal] = useState(false);
  const { state: fields, setField, handleChange } = useFormState({ name: '', value: '', maxUnits: '' });

  const controller = useMemo(
    () => new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, treasure_id: treasureId } =
    GameTreasureEditController.getGameTreasureEditParamsFromHash(currentHash);
  const isExclusive = GameTreasureEditController.isExclusiveTreasure(treasure);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!treasure) return;

    setField('name', treasure.name ?? '');
    setField('value', treasure.value !== null ? String(treasure.value) : '');
    setField(
      'maxUnits', treasure.max_units !== null && treasure.max_units !== undefined ? String(treasure.max_units) : '',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasure]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    treasureId,
    { ...fields, isExclusive },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameTreasureEditHelper.renderLoading();
  if (error) return GameTreasureEditHelper.renderError(error);

  return (
    <>
      {GameTreasureEditHelper.render(
        {
          ...fields, status, fieldErrors, isExclusive, gameType: treasure?.game_type ?? 'dnd',
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onOpenValueModal: () => setShowValueModal(true),
          onMaxUnitsChange: handleChange('maxUnits'),
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
