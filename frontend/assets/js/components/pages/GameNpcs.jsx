import React, { useEffect, useMemo, useState } from 'react';
import GameNpcsController from './controllers/GameNpcsController.js';

/**
 * Render game NPCs page.
 *
 * @returns {React.ReactElement} Game NPCs page.
 */
export default function GameNpcs() {
  const [npcs, setNpcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GameNpcsController(setNpcs, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) {
    return <div>Loading NPCs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>Game NPCs ({npcs.length}) - page {pagination.page}</div>;
}
