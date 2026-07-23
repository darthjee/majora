import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import BuyTreasureTabController from './controllers/BuyTreasureTabController.js';
import BuyTreasureTabHelper from './helpers/BuyTreasureTabHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Build the map of owned quantities keyed by the underlying treasure id, used to show
 * "already owned" counts for the game's catalog treasures.
 *
 * @param {object[]} ownedTreasures - Currently loaded owned-treasure entries.
 * @returns {object} Map of `treasure_id` to owned `quantity`.
 */
function buildOwnedByTreasureId(ownedTreasures) {
  return ownedTreasures.reduce((map, entry) => ({ ...map, [entry.treasure_id]: entry.quantity }), {});
}

/**
 * Buy tab of the treasure exchange modal: browses a game's catalog treasures (paginated using
 * local component state, independent of the page's URL/pagination) and lets the character spend
 * money to buy a quantity of the selected one.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible; resets and (re)loads this
 *   tab's browse state whenever it becomes `true`.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `money`,
 *   `canEdit`). `canEdit` routes the submit request through the DM/admin-only `all.json`
 *   endpoint, which accepts hidden treasures.
 * @param {object[]} [props.ownedTreasures] - Currently loaded owned-treasure entries, used to
 *   cross-reference "already owned" quantities.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`). Defaults to
 *   `dnd`.
 * @param {Function} props.onSuccess - Handler invoked with `{treasureId, treasureInfo, quantity,
 *   money, acquired}` after a successful buy action. `acquired` may be less than the requested
 *   quantity when the treasure was capped.
 * @returns {React.ReactElement} Rendered Buy tab.
 */
export default function BuyTreasureTab({
  show, character, ownedTreasures = [], gameType = 'dnd', onSuccess,
}) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [partialNotice, setPartialNotice] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new BuyTreasureTabController(), []);
  const ownedByTreasureId = useMemo(() => buildOwnedByTreasureId(ownedTreasures), [ownedTreasures]);
  const skipNextSearchEffect = useRef(true);

  const loadPage = (page, searchTerm = search) => controller.loadPage(page, character, searchTerm, setBrowse);

  useEffect(() => {
    if (!show) return;
    setSelected(null);
    setActionError('');
    setPartialNotice('');
    // See TreasureExchangeModal's original guard: only arm the skip guard when clearing the
    // search actually changes its value (and thus would otherwise re-trigger the debounce effect
    // below).
    if (search !== '') {
      skipNextSearchEffect.current = true;
      setSearch('');
    }
    loadPage(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (skipNextSearchEffect.current) {
      skipNextSearchEffect.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => loadPage(1, search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSelect = (item) => {
    setSelected(item);
    setQuantity(1);
    setActionError('');
    setPartialNotice('');
  };

  const handleCancelSelection = () => {
    setSelected(null);
    setActionError('');
  };

  const handleConfirm = () => controller.confirmBuy(selected, quantity, character, {
    setSubmitting,
    setSelected,
    setPartialNotice,
    setActionError,
    onSuccess,
    reload: () => loadPage(browse.page),
  });

  return BuyTreasureTabHelper.render(
    {
      browse, selected, quantity, submitting, actionError, partialNotice, ownedByTreasureId, gameType, search,
    },
    {
      onSelect: handleSelect,
      onCancel: handleCancelSelection,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onQuantityChange: setQuantity,
      onConfirm: handleConfirm,
      onSearchChange: setSearch,
    },
  );
}
