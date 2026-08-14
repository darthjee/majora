import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import RecruitModalController from './controllers/RecruitModalController.js';
import RecruitModalHelper from './helpers/RecruitModalHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Recruit modal (issue #943): lets a DM (or a player/staff member) enlist any number of PCs/NPCs
 * into the current `GameFaction` at once — a 1:1 structural mirror of `GiveDocumentModal`
 * (`document` → `faction`, `owned` → `enlisted`). The left side browses a game's PCs/NPCs
 * (server-side, debounced `name` search); picking a character adds it to the right-side
 * "receiving" list (a repeat click on an already-listed character is a no-op), fetching its
 * current enlistment once via the `faction.summary` endpoint. Unlike `GiveTreasureModal`, there is
 * no quantity concept — `CharacterFaction` enlistment is boolean — so an already-enlisted row is
 * left in the list, rendered grayed out, and skipped client-side on submit. Submit fires one
 * `POST .../factions/acquire.json` per non-enlisted listed character, best-effort, then re-fetches
 * each such character's summary regardless of outcome.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible; resets and (re)loads the browse
 *   list whenever it becomes `true`.
 * @param {object} props.faction - The `GameFaction` being recruited into (`id`).
 * @param {string} props.gameSlug - Game slug.
 * @param {boolean} [props.canRecruitHidden] - Whether the current user may recruit a hidden
 *   character into this faction (dm/admin); routes acquire requests through the DM/admin-only
 *   endpoint. Defaults to `false`.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} [props.onSuccess] - Handler invoked once a submit has fully settled.
 * @returns {React.ReactElement} Rendered recruit modal.
 */
export default function RecruitModal({
  show, faction, gameSlug, canRecruitHidden = false, onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('pcs');
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => new RecruitModalController(), []);
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
    character, activeTab, gameSlug, faction.id, receivingRef.current, setReceiving,
  );

  const handleClear = () => setReceiving([]);

  const handleSubmit = () => controller.submit(
    receivingRef.current, gameSlug, faction.id, canRecruitHidden,
    { setSubmitting, setReceiving },
  ).then(() => onSuccess?.());

  return RecruitModalHelper.render(
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
        (current) => RecruitModalController.removeCharacter(current, kind, characterId),
      ),
      onSubmit: handleSubmit,
      onClear: handleClear,
      onClose,
    },
  );
}
