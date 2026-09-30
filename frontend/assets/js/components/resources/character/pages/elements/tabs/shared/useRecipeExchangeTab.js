import {
  useEffect, useMemo, useRef, useState,
} from 'react';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * State/handler hook shared by the recipe exchange modal's Acquire and Remove tabs (issue #1450),
 * lifted from `AcquireDocumentTab`/`RemoveDocumentTab`'s identical browse/select/confirm wiring:
 * resets and loads page 1 whenever the modal opens, debounces the `?name=` search by 300 ms and
 * delegates submits to the controller's `confirm`.
 *
 * @param {Function} ControllerClass - `BaseRecipeExchangeTabController` subclass to instantiate.
 * @param {object} props - Tab props.
 * @param {boolean} props.show - Whether the parent modal is visible.
 * @param {object} props.character - Character context.
 * @param {Function} props.onSuccess - Called with `{gameRecipeId}` after a successful submit.
 * @returns {{state: object, handlers: object}} Tab state and event handlers for the tab helper.
 */
export default function useRecipeExchangeTab(ControllerClass, { show, character, onSuccess }) {
  const [browse, setBrowse] = useState({
    items: [], page: 1, pages: 1, loading: false, error: '',
  });
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');

  const controller = useMemo(() => new ControllerClass(), [ControllerClass]);
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

  const selectItem = (item) => {
    setSelected(item);
    setActionError('');
  };

  return {
    state: {
      browse, selected, submitting, actionError, search,
    },
    handlers: {
      onSelect: selectItem,
      onCancel: () => selectItem(null),
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onConfirm: () => controller.confirm(selected, character, {
        setSubmitting, setSelected, setActionError, onSuccess, reload: () => loadPage(browse.page),
      }),
      onSearchChange: setSearch,
    },
  };
}
