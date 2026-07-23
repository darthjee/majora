import { useState } from 'react';
import treasureExchangeTabs from './treasureExchangeTabs.js';
import TreasureExchangeModalHelper from './helpers/TreasureExchangeModalHelper.jsx';

const DEFAULT_TAB = 'buy';

/**
 * Tab-composed modal letting a character spend or gain money by exchanging treasures. Built by
 * composing independent tab components (`treasureExchangeTabs.js`, starting with Buy and Sell),
 * each owning its own browse/selection/submission state; this shell only owns which tab is
 * active — it never branches on the tab name itself, so a future resource/action pair (e.g. an
 * Items add/remove modal) can reuse it by adding a `treasureExchangeTabs.js`-shaped config map of
 * its own.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `money`,
 *   `canEdit`), forwarded as-is to the active tab's component.
 * @param {object[]} [props.ownedTreasures] - Currently loaded owned-treasure entries, forwarded
 *   to the Buy tab for its "already owned" cross-reference.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`) of the
 *   character's own game. Defaults to `dnd`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSuccess - Handler invoked with `{treasureId, treasureInfo, quantity,
 *   money, acquired}` after a successful buy/sell action, forwarded as-is to the active tab.
 * @returns {React.ReactElement} Rendered treasure exchange modal.
 */
export default function TreasureExchangeModal({
  show, character, ownedTreasures = [], gameType = 'dnd', onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  return TreasureExchangeModalHelper.render(
    show,
    {
      activeTab, tabs: treasureExchangeTabs, character, ownedTreasures, gameType, onSuccess,
    },
    {
      onClose,
      onTabChange: setActiveTab,
    },
  );
}
