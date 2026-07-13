import { useEffect, useMemo, useState } from 'react';
import GamesController from './controllers/GamesController.js';
import GamesHelper from './helpers/GamesHelper.jsx';
import AuthEvents from '../../../../utils/AuthEvents.js';
import AuthStorage from '../../../../utils/AuthStorage.js';

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
  const [loggedIn, setLoggedIn] = useState(AuthStorage.getToken() !== null);

  const controller = useMemo(
    () => new GamesController(setGames, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    const handleAuthChanged = (event) => setLoggedIn(event.detail.loggedIn);
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, []);

  if (loading) {
    return GamesHelper.renderLoading();
  }

  if (error) {
    return GamesHelper.renderError(error);
  }

  return GamesHelper.render(games, pagination, loggedIn);
}
