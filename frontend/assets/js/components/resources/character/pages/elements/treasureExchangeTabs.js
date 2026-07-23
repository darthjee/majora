import BuyTreasureTab from './tabs/BuyTreasureTab.jsx';
import SellTreasureTab from './tabs/SellTreasureTab.jsx';

/**
 * Config map driving {@link TreasureExchangeModal}'s tab composition: each entry declares the
 * tab's label, its help-tooltip text (shown via a `question-circle-fill` badge next to the
 * label), and the component rendered when that tab is active. Adding a new tab/resource (e.g. a
 * future Items add/remove pair) only requires adding an entry here — the shell itself never
 * branches on the tab name.
 *
 * @description Keeping each entry's shape minimal (`labelKey`, `tooltipKey`, `Component`) is
 *   deliberate — that is all the shell needs to compose a tab; anything tab-specific (browse
 *   state, submission, its own resource config) is owned entirely by the tab's own
 *   Component/Controller/Helper trio.
 */
export default {
  buy: {
    labelKey: 'treasure_exchange_modal.buy_tab',
    tooltipKey: 'treasure_exchange_modal.buy_tab_tooltip',
    Component: BuyTreasureTab,
  },
  sell: {
    labelKey: 'treasure_exchange_modal.sell_tab',
    tooltipKey: 'treasure_exchange_modal.sell_tab_tooltip',
    Component: SellTreasureTab,
  },
};
