import { useEffect, useMemo, useState } from 'react';
import GameSessionController from './controllers/GameSessionController.js';
import GameSessionHelper from './helpers/GameSessionHelper.jsx';

/**
 * Game session detail page.
 *
 * @returns {React.ReactElement} Game session detail page element.
 */
export default function GameSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GameSessionController(setSession, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return GameSessionHelper.renderLoading();
  if (error) return GameSessionHelper.renderError(error);
  return GameSessionHelper.render(session);
}
