import React, { useEffect, useMemo, useState } from 'react';
import CharacterController from './controllers/CharacterController.js';

/**
 * Render character detail page.
 *
 * @returns {React.ReactElement} Character page.
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

  if (loading) {
    return <div>Loading character...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>{character?.name ?? 'Character'}</div>;
}
