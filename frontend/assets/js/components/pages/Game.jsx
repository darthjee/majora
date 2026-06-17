import { useEffect, useMemo, useState } from 'react';
import GameController from './controllers/GameController.js';
import GameHelper from './helpers/GameHelper.jsx';

/**
 * Game detail page.
 *
 * @returns {React.ReactElement} Game detail page element.
 */
export default function Game() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pcs, setPcs] = useState([]);

  const controller = useMemo(
    () => new GameController(setGame, setLoading, setError, setPcs),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return GameHelper.renderLoading();
  if (error) return GameHelper.renderError(error);
  return GameHelper.render(game, pcs);
}
