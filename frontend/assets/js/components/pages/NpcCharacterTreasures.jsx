import { useEffect, useMemo, useState } from 'react';
import NpcCharacterTreasuresController, { getNpcCharacterTreasuresParamsFromHash }
  from './controllers/NpcCharacterTreasuresController.js';
import CharacterTreasuresHelper from './helpers/CharacterTreasuresHelper.jsx';

/**
 * NPC character Treasures index page.
 *
 * @returns {React.ReactElement} NPC character treasures page element.
 */
export default function NpcCharacterTreasures() {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new NpcCharacterTreasuresController(setTreasures, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } =
    getNpcCharacterTreasuresParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/npcs/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/npcs/${characterId}`;

  if (loading) return CharacterTreasuresHelper.renderLoading();
  if (error) return CharacterTreasuresHelper.renderError(error);

  return CharacterTreasuresHelper.render(treasures, pagination, basePath, backHref);
}
