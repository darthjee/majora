import { useEffect, useMemo, useState } from 'react';
import GamePcsController from './controllers/GamePcsController.js';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';

/**
 * Game Player Characters index page.
 *
 * @returns {React.ReactElement} Game PCs page element.
 */
export default function GamePcs() {
  const [pcs, setPcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamePcsController(setPcs, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = GamePcsController.getGameSlugFromPcsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/pcs`;
  const backHref = `#/games/${gameSlug}`;

  if (loading) return GameCharactersHelper.renderLoading();
  if (error) return GameCharactersHelper.renderError(error);
  return GameCharactersHelper.render(
    pcs, pagination, basePath, gameSlug, 'Player Characters', 'pc', backHref,
  );
}
