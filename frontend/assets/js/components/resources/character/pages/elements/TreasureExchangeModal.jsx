import { useEffect, useMemo, useState } from 'react';
import TreasureExchangeModalController from './controllers/TreasureExchangeModalController.js';
import TreasureExchangeModalHelper from './helpers/TreasureExchangeModalHelper.jsx';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import Translator from '../../../../../i18n/Translator.js';

const PER_PAGE = 10;

/**
 * Builds the partial-fulfillment notice shown above the browse list when an
 * acquire request was capped by the treasure's availability.
 *
 * @param {string} activeTab - Currently active tab (`acquire` or `sell`).
 * @param {number} requestedQuantity - Quantity that was requested.
 * @param {number|undefined} acquired - Units actually acquired, per the server response.
 * @returns {string} Translated notice, or an empty string when not applicable.
 */
export function buildPartialNotice(activeTab, requestedQuantity, acquired) {
  if (activeTab !== 'acquire' || typeof acquired !== 'number' || acquired >= requestedQuantity) {
    return '';
  }

  return Translator.t('treasure_exchange_modal.partially_fulfilled')
    .replace('{{acquired}}', acquired)
    .replace('{{requested}}', requestedQuantity);
}

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
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `money`).
 * @param {object[]} [props.ownedTreasures] - Currently loaded owned-treasure entries, used to
 *   cross-reference "already owned" quantities on the Acquire tab.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSuccess - Handler invoked with `{treasureId, treasureInfo,
 *   quantity, money, acquired}` after a successful acquire/sell action. `acquired` is only
 *   meaningful for acquire actions and may be less than the requested quantity when the
 *   treasure was capped (`undefined` for sell actions).
 * @returns {React.ReactElement} Rendered treasure exchange modal.
 */
export default function TreasureExchangeModal({
  show, character, ownedTreasures = [], onClose, onSuccess,
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

  const controller = useMemo(() => new TreasureExchangeModalController(), []);
  const ownedByTreasureId = useMemo(() => buildOwnedByTreasureId(ownedTreasures), [ownedTreasures]);

  const loadPage = (tab, page) => {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));
    const token = AuthStorage.getToken();
    const request = tab === 'acquire'
      ? controller.fetchAcquirePage(character.game_slug, token, {
        page, perPage: PER_PAGE, maxValue: character.money,
      })
      : controller.fetchSellPage(character.game_slug, character.id, character.is_pc, token, {
        page, perPage: PER_PAGE,
      });

    request
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'treasure_exchange_modal.load_error',
      })));
  };

  useEffect(() => {
    if (!show) return;
    setActiveTab('acquire');
    setSelected(null);
    setActionError('');
    setPartialNotice('');
    loadPage('acquire', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

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

  const handleConfirm = () => {
    const treasureId = activeTab === 'acquire' ? selected.id : selected.treasure_id;
    const requestedQuantity = quantity;
    const token = AuthStorage.getToken();
    const submit = activeTab === 'acquire'
      ? controller.acquire(character.game_slug, character.id, character.is_pc, token, { treasureId, quantity })
      : controller.sell(character.game_slug, character.id, character.is_pc, token, { treasureId, quantity });

    setSubmitting(true);

    submit.then((result) => {
      setSubmitting(false);

      if (!result.ok) {
        setActionError(result.errorKey);
        return;
      }

      setSelected(null);
      setPartialNotice(buildPartialNotice(activeTab, requestedQuantity, result.acquired));
      onSuccess({
        treasureId,
        treasureInfo: { name: selected.name, value: selected.value, photo_path: selected.photo_path },
        quantity: result.quantity,
        money: result.money,
        acquired: result.acquired,
      });
      loadPage(activeTab, browse.page);
    });
  };

  return TreasureExchangeModalHelper.render(
    show,
    {
      activeTab, browse, selected, quantity, submitting, actionError, partialNotice, ownedByTreasureId,
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
    },
  );
}
