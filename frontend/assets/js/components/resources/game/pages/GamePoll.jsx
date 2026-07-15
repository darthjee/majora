import { useEffect, useMemo, useState } from 'react';
import GamePollController from './controllers/GamePollController.js';
import GamePollHelper from './helpers/GamePollHelper.jsx';

/**
 * Game poll detail page, showing a single poll's title, description, type,
 * status, and read-only options list. Gated client-side to the game's
 * DM(s), players, and admins, since the underlying endpoint 401/403s
 * anyone else.
 *
 * @returns {React.ReactElement} Game poll detail page element.
 */
export default function GamePoll() {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamePollController(setPoll, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return GamePollHelper.renderLoading();
  if (error) return GamePollHelper.renderError(error);

  return GamePollHelper.render(poll);
}
