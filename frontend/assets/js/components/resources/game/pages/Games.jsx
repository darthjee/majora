import { useEffect, useState } from 'react';
import GamesHelper from './helpers/GamesHelper.jsx';
import AuthEvents from '../../../../utils/auth/AuthEvents.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';

/**
 * Render games index page.
 *
 * @returns {React.ReactElement} Games page.
 */
export default function Games() {
  const [loggedIn, setLoggedIn] = useState(AuthStorage.getToken() !== null);

  useEffect(() => {
    const handleAuthChanged = (event) => setLoggedIn(event.detail.loggedIn);
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, []);

  return GamesHelper.render(loggedIn);
}
