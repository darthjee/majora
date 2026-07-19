import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import TreasureExchangeModalController from './controllers/TreasureExchangeModalController.js';
import TreasureExchangeModalHelper from './helpers/TreasureExchangeModalHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Build the map of owned quantities keyed by the underlying treasure id,
 * used by the Acquire tab to show "already owned" counts.
 *
 * @param {object[]} ownedTreasures - Currently loaded owned-treasure entries.
 * @returns {object} Map of `treasure_id` to owned `quantity`.
 */
function buildOwnedByTreasureId(ownedTreasures) {
  return ownedTreasures.reduce((map, entry) => ({ ...map, [entry.treasure_id]: entry.quantity }), {});
}

/**
 * Two-tab (Acquire/Sell) modal letting a character spend or gain money by
 * exchanging treasures. Browsing is paginated using local component state,
 * so it never touches the page's URL/pagination.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `money`,
 *   `canEdit`). `canEdit` routes the Acquire tab's browse/submit requests through the
 *   DM/admin-only `all.json` endpoints, which include hidden treasures.
 * @param {object[]} [props.ownedTreasures] - Currently loaded owned-treasure entries, used to
 *   cross-reference "already owned" quantities on the Acquire tab.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`) of the
 *   character's own game, used to render browsed/selected treasure values. Every treasure
 *   browsable/sellable here belongs to the same game as the character. Defaults to `dnd`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSuccess - Handler invoked with `{treasureId, treasureInfo,
 *   quantity, money, acquired}` after a successful acquire/sell action. `acquired` is only
 *   meaningful for acquire actions and may be less than the requested quantity when the
 *   treasure was capped (`undefined` for sell actions).
 * @returns {React.ReactElement} Rendered treasure exchange modal.
 */
export default function TreasureExchangeModal({
  show, character, ownedTreasures = [], gameType = 'dnd', onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('acquire');
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [partialNotice, setPartialNotice] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new TreasureExchangeModalController(), []);
  const ownedByTreasureId = useMemo(() => buildOwnedByTreasureId(ownedTreasures), [ownedTreasures]);
  const skipNextSearchEffect = useRef(true);

  const loadPage = (tab, page, searchTerm = search) => (
    controller.loadPage(tab, page, character, searchTerm, setBrowse)
  );

  useEffect(() => {
    if (!show) return;
    setActiveTab('acquire');
    setSelected(null);
    setActionError('');
    setPartialNotice('');
    // Only arm the skip guard when clearing the search actually changes its
    // value (and thus would otherwise re-trigger the debounce effect below):
    // if it's already empty, that effect simply won't fire again, so nothing
    // needs skipping (and arming it regardless would swallow the next real
    // keystroke instead).
    if (search !== '') {
      skipNextSearchEffect.current = true;
      setSearch('');
    }
    loadPage('acquire', 1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (skipNextSearchEffect.current) {
      skipNextSearchEffect.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => loadPage(activeTab, 1, search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelected(null);
    setActionError('');
    setPartialNotice('');
    loadPage(tab, 1);
  };

  const handleSelect = (item) => {
    setSelected(item);
    setQuantity(1);
    setActionError('');
    setPartialNotice('');
  };

  const handleBack = () => {
    setSelected(null);
    setActionError('');
  };

  const handleConfirm = () => controller.confirmExchange(activeTab, selected, quantity, character, {
    setSubmitting,
    setSelected,
    setPartialNotice,
    setActionError,
    onSuccess,
    reload: () => loadPage(activeTab, browse.page),
  });

  return TreasureExchangeModalHelper.render(
    show,
    {
      activeTab,
      browse,
      selected,
      quantity,
      submitting,
      actionError,
      partialNotice,
      ownedByTreasureId,
      gameType,
      search,
      character,
    },
    {
      onClose,
      onTabChange: handleTabChange,
      onSelect: handleSelect,
      onBack: handleBack,
      onPrev: () => loadPage(activeTab, browse.page - 1),
      onNext: () => loadPage(activeTab, browse.page + 1),
      onQuantityChange: setQuantity,
      onConfirm: handleConfirm,
      onSearchChange: setSearch,
    },
  );
}
