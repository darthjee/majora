import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import GiveTreasureModalController from './controllers/GiveTreasureModalController.js';
import GiveTreasureModalHelper from './helpers/GiveTreasureModalHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Give-treasure modal (issue #1001): lets a DM (or a player, for their own PC) grant the current
 * `Treasure` to any number of PCs/NPCs at once, with a configurable quantity per character. The
 * left side browses a game's PCs/NPCs (server-side, debounced `name` search); picking a character
 * adds it to the right-side "receiving" list (or increments its pending quantity if already
 * listed), fetching its current owned quantity once via the `treasure.summary` endpoint. Unlike
 * `GiveItemModal`, the running total of every row's pending quantity is capped client-side
 * against the treasure's own `available_units` (`null` means unlimited, no cap). Submit fires
 * one `POST .../treasures/acquire.json` per listed character, best-effort, then re-fetches each
 * character's summary regardless of outcome.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible; resets and (re)loads the browse
 *   list whenever it becomes `true`.
 * @param {object} props.treasure - The `Treasure` being given (`id`, `hidden`, `available_units`).
 * @param {string} props.gameSlug - Game slug.
 * @param {boolean} [props.canEdit] - Whether the current user may edit this treasure (dm/admin);
 *   routes acquire requests through the DM/admin-only endpoint, which accepts a hidden `Treasure`.
 *   Defaults to `false`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} [props.onSuccess] - Handler invoked once a submit has fully settled.
 * @returns {React.ReactElement} Rendered give-treasure modal.
 */
export default function GiveTreasureModal({
  show, treasure, gameSlug, canEdit = false, onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('pcs');
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => new GiveTreasureModalController(), []);
  const skipNextSearchEffect = useRef(true);
  const receivingRef = useRef(receiving);
  receivingRef.current = receiving;

  const availableUnits = treasure.available_units ?? null;

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
    character, activeTab, gameSlug, treasure.id, receivingRef.current, setReceiving, availableUnits,
  );

  const handleClear = () => setReceiving([]);

  const handleSubmit = () => controller.submit(
    receivingRef.current, gameSlug, treasure.id, canEdit,
    { setSubmitting, setReceiving },
  ).then(() => onSuccess?.());

  return GiveTreasureModalHelper.render(
    show,
    {
      activeTab, browse, search, receiving, submitting, availableUnits,
    },
    {
      onTabChange: setActiveTab,
      onSearchChange: setSearch,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onSelectCharacter: handleSelectCharacter,
      onIncrement: (kind, characterId) => setReceiving(
        (current) => GiveTreasureModalController.incrementPending(current, kind, characterId, availableUnits),
      ),
      onDecrement: (kind, characterId) => setReceiving(
        (current) => GiveTreasureModalController.decrementPending(current, kind, characterId),
      ),
      onRemove: (kind, characterId) => setReceiving(
        (current) => GiveTreasureModalController.removeCharacter(current, kind, characterId),
      ),
      onSubmit: handleSubmit,
      onClear: handleClear,
      onClose,
    },
  );
}
