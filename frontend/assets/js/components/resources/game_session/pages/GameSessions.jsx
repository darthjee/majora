import { useEffect, useMemo, useState } from 'react';
import GameSessionsController from './controllers/GameSessionsController.js';
import GameSessionsHelper from './helpers/GameSessionsHelper.jsx';
import { buildDefaultSessionColumns } from './sessionColumns.js';

/**
 * Game Sessions index page.
 *
 * @returns {React.ReactElement} Game sessions page element.
 */
export default function GameSessions() {
  const [columns, setColumns] = useState(buildDefaultSessionColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const controller = useMemo(
    () => new GameSessionsController(setColumns, setLoading, setError, null, setCanEdit),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = GameSessionsController.getGameSlugFromSessionsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/sessions`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/sessions/new`;

  if (loading) return GameSessionsHelper.renderLoading();
  if (error) return GameSessionsHelper.renderError(error);

  return GameSessionsHelper.render(columns, basePath, backHref, canEdit, newHref);
}
