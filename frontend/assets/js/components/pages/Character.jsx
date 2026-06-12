import { useEffect, useMemo, useState } from 'react';
import CharacterController from './controllers/CharacterController.js';
import CharacterHelper from './helpers/CharacterHelper.jsx';

/**
 * Character detail page.
 *
 * @returns {React.ReactElement} Character detail page element.
 */
export default function Character() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new CharacterController(setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  return CharacterHelper.render(character);
}
