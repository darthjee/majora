import React, { useEffect, useMemo, useState } from 'react';
import GamesController from './controllers/GamesController.js';

/**
 * Render games index page.
 *
 * @returns {React.ReactElement} Games page.
 */
export default function Games() {
  const [games, setGames] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamesController(setGames, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) {
    return <div>Loading games...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>Games ({games.length}) - page {pagination.page}</div>;
}
