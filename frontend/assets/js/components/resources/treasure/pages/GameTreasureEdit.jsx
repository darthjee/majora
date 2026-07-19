import { useEffect, useMemo, useState } from 'react';
import GameTreasureEditController from './controllers/GameTreasureEditController.js';
import GameTreasureEditHelper from './helpers/GameTreasureEditHelper.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

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
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [maxUnits, setMaxUnits] = useState('');
  const [showValueModal, setShowValueModal] = useState(false);

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

    setName(treasure.name ?? '');
    setValue(treasure.value !== null ? String(treasure.value) : '');
    setMaxUnits(treasure.max_units !== null && treasure.max_units !== undefined ? String(treasure.max_units) : '');
  }, [treasure]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    treasureId,
    { name, value, maxUnits, isExclusive },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameTreasureEditHelper.renderLoading();
  if (error) return GameTreasureEditHelper.renderError(error);

  return (
    <>
      {GameTreasureEditHelper.render(
        {
          name, value, maxUnits, status, fieldErrors, isExclusive, gameType: treasure?.game_type ?? 'dnd',
        },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onOpenValueModal: () => setShowValueModal(true),
          onMaxUnitsChange: (event) => setMaxUnits(event.target.value),
        },
      )}
      <MoneyEditModal
        show={showValueModal}
        money={value}
        context="treasure"
        gameType={treasure?.game_type ?? 'dnd'}
        onClose={() => setShowValueModal(false)}
        onConfirm={(newTotal) => {
          setValue(String(newTotal));
          setShowValueModal(false);
        }}
      />
    </>
  );
}
