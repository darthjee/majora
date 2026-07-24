import CardItemImage from '../../../../../../common/cards/CardItemImage.jsx';
import BrowsePager from '../../../../../../common/pagination/BrowsePager.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

function renderActionError(actionError) {
  if (!actionError) {
    return null;
  }

  return <div className="alert alert-danger">{Translator.t(actionError)}</div>;
}

/**
 * Rendering helper for the item exchange modal's Remove tab: the paginated browse list of the
 * character's owned items, and — once an entry is selected — a two-column view keeping that list
 * visible on the left while a simple detail pane (image, name, and the Confirm/Cancel buttons)
 * renders on the right. No quantity input — items are binary owned/not-owned.
 */
export default class RemoveItemTabHelper {
  /**
   * Renders the Remove tab body.
   *
   * @param {object} state - Tab state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`).
   * @param {object|null} state.selected - Currently selected owned-item entry, or null.
   * @param {boolean} state.submitting - Whether a remove request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} handlers - Tab event handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Remove tab body.
   */
  static render(state, handlers) {
    const { selected } = state;

    if (!selected) {
      return RemoveItemTabHelper.#renderBrowsePane(state, handlers);
    }

    return (
      <div className="row">
        <div className="col-6">{RemoveItemTabHelper.#renderBrowsePane(state, handlers)}</div>
        <div className="col-6">{RemoveItemTabHelper.#renderDetailPane(state, handlers)}</div>
      </div>
    );
  }

  static #renderDetailPane(state, handlers) {
    const { selected, submitting, actionError } = state;

    return (
      <div>
        <div className="d-flex align-items-center mb-3">
          <div style={{ width: '96px' }}>
            <CardItemImage url={selected.photo_path} alt={selected.name} />
          </div>
          <div className="ms-3">
            <h5>{selected.name}</h5>
          </div>
        </div>
        {renderActionError(actionError)}
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary" onClick={handlers.onConfirm} disabled={submitting}>
            {Translator.t('item_exchange_modal.confirm')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
            {Translator.t('item_exchange_modal.cancel_selection')}
          </button>
        </div>
      </div>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {RemoveItemTabHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {RemoveItemTabHelper.#renderBrowseList(state, handlers)}
      </>
    );
  }

  static #renderSearchInput(search, onSearchChange) {
    return (
      <input
        type="text"
        className="form-control mb-3"
        placeholder={Translator.t('item_exchange_modal.search_placeholder')}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    );
  }

  static #renderBrowseList(state, handlers) {
    const { browse } = state;

    if (browse.loading) {
      return <p className="text-muted">{Translator.t('item_exchange_modal.loading')}</p>;
    }

    if (browse.error) {
      return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
    }

    if (browse.items.length === 0) {
      return <p className="text-muted">{Translator.t('item_exchange_modal.empty')}</p>;
    }

    return (
      <div className="list-group mb-3">
        {browse.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            onClick={() => handlers.onSelect(item)}
          >
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    );
  }
}
