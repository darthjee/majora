import { useEffect, useMemo, useState } from 'react';
import NpcCharacterTreasuresController, { getNpcCharacterTreasuresParamsFromHash }
  from './controllers/NpcCharacterTreasuresController.js';
import CharacterTreasuresHelper from './helpers/CharacterTreasuresHelper.jsx';
import TreasureExchangeModal from '../elements/TreasureExchangeModal.jsx';
import mergeCharacterTreasureQuantity from '../../utils/mergeCharacterTreasureQuantity.js';

/**
 * NPC character Treasures index page.
 *
 * @returns {React.ReactElement} NPC character treasures page element.
 */
export default function NpcCharacterTreasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const controller = useMemo(
    () => new NpcCharacterTreasuresController(setTreasures, setPagination, setLoading, setError, null, setCharacter),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } =
    getNpcCharacterTreasuresParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/npcs/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/npcs/${characterId}`;

  const handleExchangeSuccess = ({ treasureId, treasureInfo, quantity, money }) => {
    setCharacter((prev) => (prev ? { ...prev, money } : prev));
    setTreasures((prev) => mergeCharacterTreasureQuantity(prev, treasureId, treasureInfo, quantity));
  };

  if (loading) return CharacterTreasuresHelper.renderLoading();
  if (error) return CharacterTreasuresHelper.renderError(error);

  return (
    <>
      {CharacterTreasuresHelper.render(
        treasures, pagination, basePath, backHref, character?.can_edit,
        () => setShowExchangeModal(true),
      )}
      <TreasureExchangeModal
        show={showExchangeModal}
        character={{
          id: characterId, game_slug: gameSlug, is_pc: false, money: character?.money ?? 0,
        }}
        ownedTreasures={treasures}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
