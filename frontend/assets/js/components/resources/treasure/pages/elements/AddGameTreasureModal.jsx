import { useEffect, useMemo, useState } from 'react';
import AddGameTreasureModalController from './controllers/AddGameTreasureModalController.js';
import AddGameTreasureModalHelper from './helpers/AddGameTreasureModalHelper.jsx';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';

const PER_PAGE = 10;

const INITIAL_BROWSE = {
  items: [], page: 1, pages: 1, loading: false, error: '',
};

const INITIAL_FORM_STATE = {
  value: '', hidden: false, hasMaxUnits: false, maxUnits: '',
};

/**
 * Build the link request payload from the modal's form state, sending
 * `max_units` as `null` when the field's switch is off.
 *
 * @param {object} selected - Currently selected browse item (the catalog treasure).
 * @param {{value: string, hidden: boolean, hasMaxUnits: boolean, maxUnits: string}}
 *   formState - Current form state.
 * @returns {{treasure_id: number, value: number, hidden: boolean, max_units: number|null}}
 *   Link request payload.
 */
export function buildLinkPayload(selected, formState) {
  return {
    treasure_id: selected.id,
    value: Number(formState.value),
    hidden: formState.hidden,
    max_units: formState.hasMaxUnits ? Number(formState.maxUnits) : null,
  };
}

/**
 * Seed the form state for a newly selected browse item, prefilling `value` from the catalog
 * treasure's own value (per the issue's "already filled but editable" ask) and resetting
 * `hidden`/the `max_units` switch to their defaults.
 *
 * @param {object} item - Selected browse item (the catalog treasure).
 * @returns {{value: number, hidden: boolean, hasMaxUnits: boolean, maxUnits: string}} Seeded
 *   form state.
 */
export function buildSeededFormState(item) {
  return {
    value: item.value, hidden: false, hasMaxUnits: false, maxUnits: '',
  };
}

/**
 * Modal letting a DM/superuser browse catalog treasures not yet linked to a game, select one,
 * edit its game-specific `value`/`hidden`/`max_units`, and link it as a `GameTreasure`.
 * Browsing is paginated using local component state, so it never touches the page's URL.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} props.gameSlug - Slug of the game the treasure is linked to.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSuccess - Handler invoked after a successful link action. The
 *   parent is responsible for closing the modal and reloading the page's treasure list.
 * @returns {React.ReactElement} Rendered Add Treasure modal.
 */
export default function AddGameTreasureModal({
  show, gameSlug, onClose, onSuccess,
}) {
  const [browse, setBrowse] = useState(INITIAL_BROWSE);
  const [selected, setSelected] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const controller = useMemo(() => new AddGameTreasureModalController(), []);

  const loadPage = (page) => {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));
    const token = AuthStorage.getToken();

    controller.fetchMissingPage(gameSlug, token, { page, perPage: PER_PAGE })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'add_game_treasure_modal.load_error',
      })));
  };

  useEffect(() => {
    if (!show) return;
    setSelected(null);
    setFormState(INITIAL_FORM_STATE);
    setActionError('');
    setSubmitting(false);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleSelect = (item) => {
    setSelected(item);
    setFormState(buildSeededFormState(item));
    setActionError('');
  };

  const handleBack = () => {
    setSelected(null);
    setActionError('');
  };

  const handleSubmit = () => {
    const token = AuthStorage.getToken();
    const payload = buildLinkPayload(selected, formState);

    setSubmitting(true);

    controller.link(gameSlug, token, payload).then((result) => {
      setSubmitting(false);

      if (!result.ok) {
        setActionError(result.errorKey);
        return;
      }

      onSuccess();
    });
  };

  return AddGameTreasureModalHelper.render(
    show,
    {
      browse, selected, formState, submitting, actionError,
    },
    {
      onClose,
      onSelect: handleSelect,
      onBack: handleBack,
      onPrev: () => loadPage(browse.page - 1),
      onNext: () => loadPage(browse.page + 1),
      onValueChange: (value) => setFormState((prev) => ({ ...prev, value })),
      onHiddenChange: (hidden) => setFormState((prev) => ({ ...prev, hidden })),
      onHasMaxUnitsChange: (hasMaxUnits) => setFormState((prev) => ({ ...prev, hasMaxUnits })),
      onMaxUnitsChange: (maxUnits) => setFormState((prev) => ({ ...prev, maxUnits })),
      onSubmit: handleSubmit,
    },
  );
}
