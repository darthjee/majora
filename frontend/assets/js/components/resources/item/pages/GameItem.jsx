import { useEffect, useMemo, useState } from 'react';
import ItemDetailHelper from './helpers/ItemDetailHelper.jsx';
import GameItemController from './controllers/GameItemController.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game item detail page (issue #724): loads a single `GameItem` (via {@link GameItemController},
 * which picks between the public and elevated `all.json` endpoint based on the requester's
 * game-level edit permission) and delegates rendering to {@link ItemDetailHelper}.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Item controller class to instantiate, mainly for
 *   tests.
 * @returns {React.ReactElement} Game item detail page element.
 */
export default function GameItem({ ControllerClass = GameItemController }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setItem, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameItemController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/items`;

  if (loading) return ItemDetailHelper.renderLoading();
  if (error) return ItemDetailHelper.renderError(error);

  return ItemDetailHelper.render(item, backHref);
}
