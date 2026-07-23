import TreasureMoney from '../../../../../../common/misc/TreasureMoney.jsx';
import BrowsePager from '../../../../../../common/pagination/BrowsePager.jsx';
import Translator from '../../../../../../../i18n/Translator.js';
import ExchangeDetailPane from '../shared/ExchangeDetailPane.jsx';

/**
 * Rendering helper for the treasure exchange modal's Remove tab: the paginated browse list of the
 * character's owned treasures, and — once an entry is selected — a two-column view keeping that
 * list visible on the left while the shared {@link ExchangeDetailPane} renders on the right.
 */
export default class RemoveTreasureTabHelper {
  /**
   * Renders the Remove tab body.
   *
   * @param {object} state - Tab state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`).
   * @param {object|null} state.selected - Currently selected owned-treasure entry, or null.
   * @param {number} state.quantity - Quantity to remove for the selected item.
   * @param {boolean} state.submitting - Whether a remove request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} handlers - Tab event handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onQuantityChange`, `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Remove tab body.
   */
  static render(state, handlers) {
    const { selected } = state;

    if (!selected) {
      return RemoveTreasureTabHelper.#renderBrowsePane(state, handlers);
    }

    return (
      <div className="row">
        <div className="col-6">{RemoveTreasureTabHelper.#renderBrowsePane(state, handlers)}</div>
        <div className="col-6">
          <ExchangeDetailPane
            selected={selected}
            quantity={state.quantity}
            owned={selected.quantity}
            maxQuantity={selected.quantity}
            submitting={state.submitting}
            actionError={state.actionError}
            gameType={state.gameType}
            onQuantityChange={handlers.onQuantityChange}
            onConfirm={handlers.onConfirm}
            onCancel={handlers.onCancel}
          />
        </div>
      </div>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {RemoveTreasureTabHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {RemoveTreasureTabHelper.#renderBrowseList(state, handlers)}
      </>
    );
  }

  static #renderSearchInput(search, onSearchChange) {
    return (
      <input
        type="text"
        className="form-control mb-3"
        placeholder={Translator.t('treasure_exchange_modal.search_placeholder')}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    );
  }

  static #renderBrowseList(state, handlers) {
    const { browse, gameType } = state;

    if (browse.loading) {
      return <p className="text-muted">{Translator.t('treasure_exchange_modal.loading')}</p>;
    }

    if (browse.error) {
      return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
    }

    if (browse.items.length === 0) {
      return <p className="text-muted">{Translator.t('treasure_exchange_modal.empty')}</p>;
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
            <span className="text-muted"><TreasureMoney value={item.value} gameType={gameType} /></span>
          </button>
        ))}
      </div>
    );
  }
}
