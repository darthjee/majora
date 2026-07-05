import { useEffect, useMemo, useState } from 'react';
import GameNpcsController, { getGameSlugFromNpcsHash } from './controllers/GameNpcsController.js';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';
import Translator from '../../i18n/Translator.js';

/**
 * Game Non-Player Characters index page.
 *
 * @returns {React.ReactElement} Game NPCs page element.
 */
export default function GameNpcs() {
  const [npcs, setNpcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const controller = useMemo(
    () => new GameNpcsController(setNpcs, setPagination, setLoading, setError, null, null, setCanEdit),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = getGameSlugFromNpcsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/npcs`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/npcs/new`;

  if (loading) return GameCharactersHelper.renderLoading();
  if (error) return GameCharactersHelper.renderError(error);
  return GameCharactersHelper.render(
    npcs, pagination, basePath, gameSlug, Translator.t('game_npcs_page.title'), 'npc', backHref,
    canEdit, newHref,
  );
}
