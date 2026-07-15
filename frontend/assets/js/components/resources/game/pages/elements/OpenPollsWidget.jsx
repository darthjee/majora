import { useEffect, useMemo, useState } from 'react';
import OpenPollsWidgetController from './controllers/OpenPollsWidgetController.js';
import OpenPollsWidgetHelper from './helpers/OpenPollsWidgetHelper.jsx';

/**
 * Determines whether the widget's audience (the game's DM(s), players, or
 * admins) may see it.
 *
 * @param {object} game - Game data object.
 * @param {boolean} [game.is_dm] - Whether the current user is a DM of the game.
 * @param {boolean} [game.is_player] - Whether the current user is a player of the game.
 * @param {boolean} [game.is_superuser] - Whether the current user is a superuser.
 * @param {boolean} [game.is_staff] - Whether the current user is staff.
 * @returns {boolean} Whether the widget should be rendered.
 */
function isVisible(game) {
  return Boolean(game?.is_dm || game?.is_player || game?.is_superuser || game?.is_staff);
}

/**
 * Self-fetching widget rendered on the game show page, right below the
 * "Next session" section, showing the count of open polls and a link to
 * the game polls list. Visible only to the game's DM(s), players, and
 * admins (superuser/staff); renders nothing otherwise.
 *
 * @param {object} props - Component props.
 * @param {object} props.game - Game data object, needing `game_slug`, `is_dm`,
 *   `is_player`, `is_superuser`, and `is_staff`.
 * @returns {React.ReactElement|null} The widget element, or `null` when not visible.
 */
export default function OpenPollsWidget({ game }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const visible = isVisible(game);

  const controller = useMemo(() => new OpenPollsWidgetController(setCount, setLoading), []);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    return controller.buildEffect(game.game_slug)();
  }, [controller, visible, game?.game_slug]);

  if (!visible) {
    return null;
  }

  return OpenPollsWidgetHelper.render({ count, loading, gameSlug: game.game_slug });
}
