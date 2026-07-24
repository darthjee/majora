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
 * Rendering helper for the item exchange modal's Acquire tab: the paginated browse list of a
 * game's Acquire catalog (already excluding owned items), and — once an entry is selected — a
 * two-column view keeping that list visible on the left while a detail pane (image, name, a
 * "hidden" switch, and the Confirm/Cancel buttons) renders on the right. No quantity input and no
 * shared `ExchangeDetailPane` reuse — items have no quantity/money to show, and the "hidden"
 * switch has no treasure equivalent.
 */
export default class AcquireItemTabHelper {
  /**
   * Renders the Acquire tab body.
   *
   * @param {object} state - Tab state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`).
   * @param {object|null} state.selected - Currently selected browse item, or null.
   * @param {boolean} state.hidden - Whether the acquired `CharacterItem` should be marked hidden.
   * @param {boolean} state.submitting - Whether an acquire request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} handlers - Tab event handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onHiddenChange`, `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Acquire tab body.
   */
  static render(state, handlers) {
    const { selected } = state;

    if (!selected) {
      return AcquireItemTabHelper.#renderBrowsePane(state, handlers);
    }

    return (
      <div className="row">
        <div className="col-6">{AcquireItemTabHelper.#renderBrowsePane(state, handlers)}</div>
        <div className="col-6">{AcquireItemTabHelper.#renderDetailPane(state, handlers)}</div>
      </div>
    );
  }

  static #renderDetailPane(state, handlers) {
    const {
      selected, hidden, submitting, actionError,
    } = state;

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
        <div className="form-check form-switch mb-3">
          <input
            id="item-exchange-hidden"
            className="form-check-input"
            type="checkbox"
            checked={hidden}
            onChange={(event) => handlers.onHiddenChange(event.target.checked)}
          />
          <label className="form-check-label" htmlFor="item-exchange-hidden">
            {Translator.t('item_exchange_modal.hidden_label')}
          </label>
        </div>
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
        {AcquireItemTabHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {AcquireItemTabHelper.#renderBrowseList(state, handlers)}
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
