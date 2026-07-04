import { useEffect, useMemo, useState } from 'react';
import GameSessionsController, { getGameSlugFromSessionsHash } from './controllers/GameSessionsController.js';
import GameSessionsHelper from './helpers/GameSessionsHelper.jsx';

/**
 * Game Sessions index page.
 *
 * @returns {React.ReactElement} Game sessions page element.
 */
export default function GameSessions() {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const controller = useMemo(
    () => new GameSessionsController(setSessions, setPagination, setLoading, setError, null, setCanEdit),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = getGameSlugFromSessionsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/sessions`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/sessions/new`;

  if (loading) return GameSessionsHelper.renderLoading();
  if (error) return GameSessionsHelper.renderError(error);

  return GameSessionsHelper.render(sessions, pagination, basePath, backHref, canEdit, newHref);
}
