import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import AcquireFactionTabController from './controllers/AcquireFactionTabController.js';
import AcquireFactionTabHelper from './helpers/AcquireFactionTabHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Enlist tab of the faction exchange modal (issue #943): browses a game's `GameFaction` catalog,
 * already excluded of factions the character is enlisted in (server-side, via
 * `factions/available.json`), and lets the character be enlisted into the selected one as a new
 * `CharacterFaction`. Like the document Acquire tab, there is no quantity input (faction
 * membership is binary enlisted/not-enlisted) and no "already enlisted" cross-reference to show —
 * unlike `AcquireDocumentTab`, there is also no "hidden" switch: `GameFaction` has no `hidden`
 * field of its own to default a `CharacterFaction`'s from, so this tab always submits
 * `hidden: false` (see `AcquireFactionTabController`'s own description).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible; resets and (re)loads this
 *   tab's browse state whenever it becomes `true`.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
 *   `gameCanEdit` routes the submit request through the DM/admin-only `all.json` endpoint, which
 *   accepts hidden game factions.
 * @param {Function} props.onSuccess - Handler invoked with `{gameFactionId, characterFaction}`
 *   after a successful acquire action.
 * @returns {React.ReactElement} Rendered Enlist tab.
 */
export default function AcquireFactionTab({ show, character, onSuccess }) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new AcquireFactionTabController(), []);
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
    setActionError('');
  };

  const handleCancelSelection = () => {
    setSelected(null);
    setActionError('');
  };

  const handleConfirm = () => controller.confirmAcquire(selected, character, {
    setSubmitting,
    setSelected,
    setActionError,
    onSuccess,
    reload: () => loadPage(browse.page),
  });

  return AcquireFactionTabHelper.render(
    {
      browse, selected, submitting, actionError, search,
    },
    {
      onSelect: handleSelect,
      onCancel: handleCancelSelection,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onConfirm: handleConfirm,
      onSearchChange: setSearch,
    },
  );
}
