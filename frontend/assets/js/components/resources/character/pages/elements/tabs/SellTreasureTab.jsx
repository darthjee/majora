import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import SellTreasureTabController from './controllers/SellTreasureTabController.js';
import SellTreasureTabHelper from './helpers/SellTreasureTabHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Sell tab of the treasure exchange modal: browses the character's owned treasures (paginated
 * using local component state, independent of the page's URL/pagination) and lets the character
 * sell a quantity of the selected one, refunding its value into money.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible; resets and (re)loads this
 *   tab's browse state whenever it becomes `true`.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`).
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`). Defaults to
 *   `dnd`.
 * @param {Function} props.onSuccess - Handler invoked with `{treasureId, treasureInfo, quantity,
 *   money}` after a successful sell action.
 * @returns {React.ReactElement} Rendered Sell tab.
 */
export default function SellTreasureTab({
  show, character, gameType = 'dnd', onSuccess,
}) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new SellTreasureTabController(), []);
  const skipNextSearchEffect = useRef(true);

  const loadPage = (page, searchTerm = search) => controller.loadPage(page, character, searchTerm, setBrowse);

  useEffect(() => {
    if (!show) return;
    setSelected(null);
    setActionError('');
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
  };

  const handleCancelSelection = () => {
    setSelected(null);
    setActionError('');
  };

  const handleConfirm = () => controller.confirmSell(selected, quantity, character, {
    setSubmitting,
    setSelected,
    setActionError,
    onSuccess,
    reload: () => loadPage(browse.page),
  });

  return SellTreasureTabHelper.render(
    {
      browse, selected, quantity, submitting, actionError, gameType, search,
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
