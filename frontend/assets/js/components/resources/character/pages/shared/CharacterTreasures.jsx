import { useEffect, useMemo, useState } from 'react';
import CharacterTreasuresHelper from '../helpers/CharacterTreasuresHelper.jsx';
import TreasureExchangeModal from '../elements/TreasureExchangeModal.jsx';
import mergeCharacterTreasureQuantity from '../../../../../utils/money/mergeCharacterTreasureQuantity.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';

/**
 * Shared character treasures index page component.
 *
 * @description Accepts a type-specific controller class, hash param extractor, and
 *   character kind as props, so NPC and PC treasures pages can share identical logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Treasures controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through
 *   to the treasure exchange modal.
 * @returns {React.ReactElement} Character treasures page element.
 */
export default function CharacterTreasures({ ControllerClass, getParamsFromHash, characterKind, isPc }) {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setTreasures, setPagination, setLoading, setError, null, setCharacter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

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
          id: characterId, game_slug: gameSlug, is_pc: isPc, money: character?.money ?? 0,
        }}
        ownedTreasures={treasures}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
