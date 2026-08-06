import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import GiveDocumentModalController from './controllers/GiveDocumentModalController.js';
import GiveDocumentModalHelper from './helpers/GiveDocumentModalHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Give-document modal (issue #1005): lets a DM (or a player/staff member) grant the current
 * `GameDocument` to any number of PCs/NPCs at once. The left side browses a game's PCs/NPCs
 * (server-side, debounced `name` search); picking a character adds it to the right-side
 * "receiving" list (a repeat click on an already-listed character is a no-op), fetching its
 * current ownership once via the `document.summary` endpoint. Unlike `GiveTreasureModal`, there is
 * no quantity concept — `CharacterDocument` ownership is boolean — so an already-owned row is left
 * in the list, rendered grayed out, and skipped client-side on submit. Submit fires one
 * `POST .../documents/acquire.json` per non-owned listed character, best-effort, then re-fetches
 * each such character's summary regardless of outcome.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible; resets and (re)loads the browse
 *   list whenever it becomes `true`.
 * @param {object} props.document - The `GameDocument` being given (`id`, `hidden`).
 * @param {string} props.gameSlug - Game slug.
 * @param {boolean} [props.canGiveHidden] - Whether the current user may give this document even
 *   when hidden (dm/admin); routes acquire requests through the DM/admin-only endpoint. Defaults
 *   to `false`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} [props.onSuccess] - Handler invoked once a submit has fully settled.
 * @returns {React.ReactElement} Rendered give-document modal.
 */
export default function GiveDocumentModal({
  show, document, gameSlug, canGiveHidden = false, onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('pcs');
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => new GiveDocumentModalController(), []);
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
    character, activeTab, gameSlug, document.id, receivingRef.current, setReceiving,
  );

  const handleClear = () => setReceiving([]);

  const handleSubmit = () => controller.submit(
    receivingRef.current, gameSlug, document.id, canGiveHidden,
    { setSubmitting, setReceiving },
  ).then(() => onSuccess?.());

  return GiveDocumentModalHelper.render(
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
      onRemove: (kind, characterId) => setReceiving(
        (current) => GiveDocumentModalController.removeCharacter(current, kind, characterId),
      ),
      onSubmit: handleSubmit,
      onClear: handleClear,
      onClose,
    },
  );
}
