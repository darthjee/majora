import { useEffect, useMemo, useState } from 'react';
import NpcCharacterFullController, { getNpcCharacterFullParamsFromHash }
  from './controllers/NpcCharacterFullController.js';
import CharacterFullHelper from './helpers/CharacterFullHelper.jsx';
import AuthEvents from '../../utils/AuthEvents.js';

/**
 * NPC character full detail page (editor-only view with DM notes).
 *
 * @returns {React.ReactElement} NPC character full detail page element.
 */
export default function NpcCharacterFull() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new NpcCharacterFullController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug } = getNpcCharacterFullParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/npcs`;

  if (loading) return CharacterFullHelper.renderLoading();
  if (error) return CharacterFullHelper.renderError(error);
  return CharacterFullHelper.render(character, backHref);
}
