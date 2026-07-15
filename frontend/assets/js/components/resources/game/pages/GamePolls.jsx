import { useEffect, useMemo, useState } from 'react';
import GamePollsController from './controllers/GamePollsController.js';
import GamePollsHelper from './helpers/GamePollsHelper.jsx';
import PollFilters from './elements/PollFilters.jsx';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';

/**
 * Game Polls index page, listing polls for a game with a status filter and
 * pagination. Gated client-side to the game's DM(s), players, and admins,
 * since the underlying endpoint 401/403s anyone else.
 *
 * @returns {React.ReactElement} Game polls page element.
 */
export default function GamePolls() {
  const [polls, setPolls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new GamePollsController(setPolls, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const gameSlug = GamePollsController.getGameSlugFromPollsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/polls`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/polls/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleFilterQuery = (filters) => {
    window.location.hash = GamePollsController.buildFilterQueryHash(basePath, filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    controller.buildEffect()();
  };

  if (loading) return GamePollsHelper.renderLoading();
  if (error) return GamePollsHelper.renderError(error);

  return GamePollsHelper.render({
    polls,
    pagination,
    gameSlug,
    basePath,
    backHref,
    newHref,
    activeFilters,
    filters: <PollFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />,
  });
}
