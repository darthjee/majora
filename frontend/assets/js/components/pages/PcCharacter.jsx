import { useEffect, useMemo, useState } from 'react';
import PcCharacterController, { getPcCharacterParamsFromHash }
  from './controllers/PcCharacterController.js';
import CharacterHelper from './helpers/CharacterHelper.jsx';

/**
 * PC character detail page.
 *
 * @returns {React.ReactElement} PC character detail page element.
 */
export default function PcCharacter() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new PcCharacterController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = getPcCharacterParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/pcs`;

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  return CharacterHelper.render(character, backHref);
}
