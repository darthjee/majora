import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import RemoveDocumentTabController from './controllers/RemoveDocumentTabController.js';
import RemoveDocumentTabHelper from './helpers/RemoveDocumentTabHelper.jsx';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Remove tab of the document exchange modal: browses the character's owned documents (paginated
 * using local component state, independent of the page's URL/pagination) and lets the selected
 * one be removed from the character (issue #920). Like the item Remove tab, there is no quantity
 * input — documents are binary owned/not-owned, so removing deletes the `CharacterDocument` row
 * outright, leaving the underlying `GameDocument` untouched.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the parent modal is visible; resets and (re)loads this
 *   tab's browse state whenever it becomes `true`.
 * @param {object} props.character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
 *   `canEdit` (character-level) routes the submit request through the restricted `all.json`
 *   endpoint, which accepts a hidden owned document.
 * @param {Function} props.onSuccess - Handler invoked with `{gameDocumentId}` after a successful
 *   remove action.
 * @returns {React.ReactElement} Rendered Remove tab.
 */
export default function RemoveDocumentTab({ show, character, onSuccess }) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new RemoveDocumentTabController(), []);
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

  const handleConfirm = () => controller.confirmRemove(selected, character, {
    setSubmitting,
    setSelected,
    setActionError,
    onSuccess,
    reload: () => loadPage(browse.page),
  });

  return RemoveDocumentTabHelper.render(
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
