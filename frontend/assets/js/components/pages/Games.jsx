import { useEffect, useMemo, useState } from 'react';
import GamesController from './controllers/GamesController.js';
import GamesHelper from './helpers/GamesHelper.jsx';

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
    return GamesHelper.renderLoading();
  }

  if (error) {
    return GamesHelper.renderError(error);
  }

  return GamesHelper.render(games, pagination);
}
