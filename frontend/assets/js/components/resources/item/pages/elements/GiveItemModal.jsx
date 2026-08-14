import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import GiveItemModalController from './controllers/GiveItemModalController.js';
import GiveItemModalHelper from './helpers/GiveItemModalHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Give-item modal (issue #827): lets a DM (or a player, for their own PC) grant the current
 * `GameItem` to any number of PCs/NPCs at once, with a configurable quantity per character. The
 * left side browses a game's PCs/NPCs (server-side, debounced `name` search); picking a character
 * adds it to the right-side "receiving" list (or increments its pending quantity if already
 * listed), fetching its current owned quantity once via the new `item.summary` endpoint. Submit
 * fires one `POST .../items/acquire.json` per pending unit across every listed character,
 * best-effort, then re-fetches each character's summary regardless of outcome.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible; resets and (re)loads the browse
 *   list whenever it becomes `true`.
 * @param {object} props.item - The `GameItem` being given (`id`, `hidden`).
 * @param {string} props.gameSlug - Game slug.
 * @param {boolean} [props.canGiveHidden] - Whether the current user may give this item even when
 *   hidden (dm/admin/staff); routes acquire requests through the DM/admin-only endpoint, which
 *   accepts a hidden `GameItem`. Defaults to `false`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} [props.onSuccess] - Handler invoked once a submit has fully settled.
 * @returns {React.ReactElement} Rendered give-item modal.
 */
export default function GiveItemModal({
  show, item, gameSlug, canGiveHidden = false, onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('pcs');
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => new GiveItemModalController(), []);
  const skipNextSearchEffect = useRef(true);
  const receivingRef = useRef(receiving);
  receivingRef.current = receiving;

  const loadPage = (page, kind = activeTab, searchTerm = search) => (
    controller.loadPage(page, gameSlug, kind, searchTerm, setBrowse)
  );

  useEffect(() => {
    if (!show) return;
    skipNextSearchEffect.current = true;
    setSearch('');
    setReceiving([]);
    loadPage(1, activeTab, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, activeTab]);

  useEffect(() => {
    if (skipNextSearchEffect.current) {
      skipNextSearchEffect.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => loadPage(1, activeTab, search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSelectCharacter = (character) => controller.addCharacter(
    character, activeTab, gameSlug, item.id, receivingRef.current, setReceiving,
  );

  const handleClear = () => setReceiving([]);

  const handleSubmit = () => controller.submit(
    receivingRef.current, gameSlug, item.id, Boolean(item.hidden), canGiveHidden,
    { setSubmitting, setReceiving },
  ).then(() => onSuccess?.());

  return GiveItemModalHelper.render(
    show,
    {
      activeTab, browse, search, receiving, submitting,
    },
    {
      onTabChange: setActiveTab,
      onSearchChange: setSearch,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onSelectCharacter: handleSelectCharacter,
      onIncrement: (kind, characterId) => setReceiving(
        (current) => GiveItemModalController.incrementPending(current, kind, characterId),
      ),
      onDecrement: (kind, characterId) => setReceiving(
        (current) => GiveItemModalController.decrementPending(current, kind, characterId),
      ),
      onRemove: (kind, characterId) => setReceiving(
        (current) => GiveItemModalController.removeCharacter(current, kind, characterId),
      ),
      onSubmit: handleSubmit,
      onClear: handleClear,
      onClose,
    },
  );
}
