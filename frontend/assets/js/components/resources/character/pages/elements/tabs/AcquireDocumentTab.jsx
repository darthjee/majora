import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import AcquireDocumentTabController from './controllers/AcquireDocumentTabController.js';
import AcquireDocumentTabHelper from './helpers/AcquireDocumentTabHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Acquire tab of the document exchange modal: browses a game's `GameDocument` catalog, already
 * excluded of documents the character owns (server-side, via `documents/available.json`), and
 * lets the character be granted the selected one as a new `CharacterDocument` (issue #920). Like
 * the item Acquire tab, there is no quantity input (documents are binary owned/not-owned) and no
 * "already owned" cross-reference to show — a "hidden" switch (defaulting to the selected
 * `GameDocument`'s own `hidden` value) is shown instead.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible; resets and (re)loads this
 *   tab's browse state whenever it becomes `true`.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
 *   `gameCanEdit` routes the submit request through the DM/admin-only `all.json` endpoint, which
 *   accepts hidden game documents.
 * @param {Function} props.onSuccess - Handler invoked with `{gameDocumentId, characterDocument}`
 *   after a successful acquire action.
 * @returns {React.ReactElement} Rendered Acquire tab.
 */
export default function AcquireDocumentTab({ show, character, onSuccess }) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new AcquireDocumentTabController(), []);
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
    setHidden(Boolean(item.hidden));
    setActionError('');
  };

  const handleCancelSelection = () => {
    setSelected(null);
    setActionError('');
  };

  const handleConfirm = () => controller.confirmAcquire(selected, hidden, character, {
    setSubmitting,
    setSelected,
    setActionError,
    onSuccess,
    reload: () => loadPage(browse.page),
  });

  return AcquireDocumentTabHelper.render(
    {
      browse, selected, hidden, submitting, actionError, search,
    },
    {
      onSelect: handleSelect,
      onCancel: handleCancelSelection,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onHiddenChange: setHidden,
      onConfirm: handleConfirm,
      onSearchChange: setSearch,
    },
  );
}
