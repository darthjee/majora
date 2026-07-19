import Translator from '../../../i18n/Translator.js';

/**
 * Renders a simple previous/next pager for locally-paginated browse state
 * (e.g. modal browse lists driven by component state rather than the URL).
 * Renders nothing when there is only one page.
 *
 * @param {object} props - Component props.
 * @param {object} props.browse - Current browse page state (`page`, `pages`).
 * @param {Function} props.onPrev - Called when the previous button is clicked.
 * @param {Function} props.onNext - Called when the next button is clicked.
 * @returns {React.ReactElement|null} Rendered pager, or null when only one page exists.
 */
export default function BrowsePager({ browse, onPrev, onNext }) {
  if (browse.pages <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={onPrev}
        disabled={browse.page <= 1}
      >
        {Translator.t('pagination.previous')}
      </button>
      <span>{`${browse.page} / ${browse.pages}`}</span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={onNext}
        disabled={browse.page >= browse.pages}
      >
        {Translator.t('pagination.next')}
      </button>
    </div>
  );
}
