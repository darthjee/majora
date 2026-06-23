import { useEffect, useMemo, useState } from 'react';
import NpcCharacterController, { getNpcCharacterParamsFromHash }
  from './controllers/NpcCharacterController.js';
import CharacterHelper from './helpers/CharacterHelper.jsx';
import AuthEvents from '../../utils/AuthEvents.js';

/**
 * NPC character detail page.
 *
 * @returns {React.ReactElement} NPC character detail page element.
 */
export default function NpcCharacter() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new NpcCharacterController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = getNpcCharacterParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/npcs`;

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  return CharacterHelper.render(character, backHref);
}
