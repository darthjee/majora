import React, { useEffect, useMemo, useState } from 'react';
import GameController from './controllers/GameController.js';

/**
 * Render game detail page.
 *
 * @returns {React.ReactElement} Game page.
 */
export default function Game() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GameController(setGame, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) {
    return <div>Loading game...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>{game?.name ?? 'Game'}</div>;
}
