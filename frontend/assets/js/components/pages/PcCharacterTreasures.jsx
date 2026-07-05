import { useEffect, useMemo, useState } from 'react';
import PcCharacterTreasuresController, { getPcCharacterTreasuresParamsFromHash }
  from './controllers/PcCharacterTreasuresController.js';
import CharacterTreasuresHelper from './helpers/CharacterTreasuresHelper.jsx';

/**
 * PC character Treasures index page.
 *
 * @returns {React.ReactElement} PC character treasures page element.
 */
export default function PcCharacterTreasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new PcCharacterTreasuresController(setTreasures, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } =
    getPcCharacterTreasuresParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/pcs/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/pcs/${characterId}`;

  if (loading) return CharacterTreasuresHelper.renderLoading();
  if (error) return CharacterTreasuresHelper.renderError(error);

  return CharacterTreasuresHelper.render(treasures, pagination, basePath, backHref);
}
