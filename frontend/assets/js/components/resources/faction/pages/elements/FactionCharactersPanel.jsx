import { useEffect, useMemo, useState } from 'react';
import FactionCharactersPanelController from './controllers/FactionCharactersPanelController.js';
import FactionCharactersPanelHelper from './helpers/FactionCharactersPanelHelper.jsx';

/**
 * Faction show page's right-column character-list panel (issue #943): a real, URL-hash-synced
 * pagination over the faction's characters (`GET /factions/:id/characters.json`, or `/all.json`
 * for DM/admin, picked automatically by `RequestStore`'s own permission resolution) — "similar to
 * `ShortList`, but not the same": no item cap, no "see all" link, closer in shape to a full
 * resource list page's card grid (e.g. `GameFactions.jsx`) embedded inside this show page's
 * column.
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in (`game_slug`, `id`, ...).
 * @param {string} props.game_slug - Game slug.
 * @param {number|string} props.id - The `GameFaction`'s own id.
 * @param {number} [props.refreshToken] - Opaque value bumped to re-trigger the panel's fetch
 *   (e.g. after a successful recruit).
 * @returns {React.ReactElement} Rendered faction character-list panel.
 */
export default function FactionCharactersPanel({ game_slug: gameSlug, id: factionId, refreshToken = 0 }) {
  const [state, setState] = useState({
    items: [], pagination: { page: 1, pages: 1, perPage: 24 }, loading: true, error: '',
  });

  const controller = useMemo(() => new FactionCharactersPanelController(), []);

  useEffect(
    () => controller.buildEffect(gameSlug, factionId, setState)(),
    [controller, gameSlug, factionId, refreshToken],
  );

  return FactionCharactersPanelHelper.render(state, gameSlug, factionId);
}
