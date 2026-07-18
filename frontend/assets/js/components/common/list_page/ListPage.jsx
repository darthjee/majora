import { useEffect, useMemo, useState } from 'react';
import ListPageController from './controllers/ListPageController.js';
import ListPageHelper from './helpers/ListPageHelper.jsx';
import FacadeRefresh from '../../../utils/access/useFacadeRefresh.js';
import Noop from '../../../utils/Noop.js';

/**
 * Shared index-list page body: fetches a list type's data (via
 * `listTypeConfig[type].fetchList`), then renders its filters, item grid, and pagination
 * through `ListPageHelper`. Owns loading/error/pagination state for the list body only —
 * page-level chrome (heading, back button, "New"/"Add" buttons, modals) stays with the owning
 * page component, which reads this component's resolved edit permission back through
 * `onCanEditChange`.
 *
 * @param {object} props - Component props.
 * @param {string} props.type - List type, a key into `listTypeConfig`.
 * @param {string} props.gameSlug - Game slug the list is scoped to.
 * @param {string} props.basePath - Base hash path used for pagination links.
 * @param {string} props.loadingMessage - Already-translated loading message, so this generic
 *   component doesn't have to pick a per-type i18n key itself.
 * @param {object} [props.context] - Extra rendering context (e.g. `onUploadClick`), merged
 *   with `{gameSlug, canEdit}` and passed through to the type's per-item builders.
 * @param {object} [props.filtersProps] - Extra props merged into the type's `filtersComponent`.
 * @param {object|URLSearchParams} [props.activeFilters] - Active query params preserved on
 *   every pagination link.
 * @param {number} [props.refreshToken] - Opaque value; changing it re-runs the fetch (e.g.
 *   after a modal success or a filter change), without remounting the component.
 * @param {Function} [props.onCanEditChange] - Called whenever the resolved edit permission
 *   changes, so the owning page can gate its own page-level actions.
 * @param {Function} [props.onItemsChange] - Called with the freshly fetched raw items whenever
 *   they change, so an owning page can read back the currently loaded page (e.g. the character
 *   treasures page cross-references it for the treasure exchange modal's "already owned"
 *   indicator) without this component having to expose its internal state directly.
 * @returns {React.ReactElement} Rendered list page body.
 */
export default function ListPage({
  type, gameSlug, basePath, loadingMessage, context = {}, filtersProps = {}, activeFilters = {},
  refreshToken = 0, onCanEditChange = Noop.noop, onItemsChange = Noop.noop,
}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const handleCanEditChange = (value) => {
    setCanEdit(value);
    onCanEditChange(value);
  };

  const handleItemsChange = (value) => {
    setItems(value);
    onItemsChange(value);
  };

  // handleCanEditChange/handleItemsChange are intentionally left out of the deps below: they're
  // recreated every render, but only type/gameSlug should force a new controller.
  const controller = useMemo(
    () => new ListPageController(
      type, gameSlug, handleItemsChange, setPagination, setLoading, setError, handleCanEditChange,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, gameSlug],
  );

  useEffect(() => controller.buildEffect()(), [controller, refreshToken]);
  FacadeRefresh.useFacadeRefresh(controller);

  if (loading) return ListPageHelper.renderLoading(loadingMessage);
  if (error) return ListPageHelper.renderError(error);

  return ListPageHelper.render(
    type, items, pagination, basePath, { ...context, gameSlug, canEdit }, filtersProps, activeFilters,
  );
}
