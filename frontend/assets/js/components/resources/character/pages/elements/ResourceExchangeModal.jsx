import { useState } from 'react';
import ResourceExchangeModalHelper from './helpers/ResourceExchangeModalHelper.jsx';

/**
 * Tab-composed modal letting a character gain, lose, or exchange a resource (treasure, item,
 * ...) through independent tab components, each owning its own browse/selection/submission
 * state; this shell only owns which tab is active — it never branches on the tab name itself, so
 * any resource/action pair (treasures via `treasureExchangeTabs.js`, items via
 * `itemExchangeTabs.js`) can reuse it by passing its own `tabs`-shaped config map and
 * `defaultTab`.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `money`,
 *   `canEdit`), forwarded as-is to the active tab's component.
 * @param {object} props.tabs - Tab config map (e.g. `treasureExchangeTabs.js`/
 *   `itemExchangeTabs.js`-shaped): each entry declares `labelKey`, `tooltipKey`, and `Component`.
 * @param {string} props.defaultTab - Tab key selected when the modal is first shown.
 * @param {object[]} [props.ownedTreasures] - Currently loaded owned-treasure entries, forwarded
 *   to the Buy tab for its "already owned" cross-reference. Treasure-specific; tabs that don't
 *   need it simply never read it.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`) of the
 *   character's own game. Defaults to `dnd`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSuccess - Handler invoked with the active tab's own success payload
 *   after a successful action, forwarded as-is to the active tab.
 * @returns {React.ReactElement} Rendered resource exchange modal.
 */
export default function ResourceExchangeModal({
  show, character, tabs, defaultTab, ownedTreasures = [], gameType = 'dnd', onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return ResourceExchangeModalHelper.render(
    show,
    {
      activeTab, tabs, character, ownedTreasures, gameType, onSuccess,
    },
    {
      onClose,
      onTabChange: setActiveTab,
    },
  );
}
