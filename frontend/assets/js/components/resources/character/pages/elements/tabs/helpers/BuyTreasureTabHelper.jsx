import TreasureMoney from '../../../../../../common/misc/TreasureMoney.jsx';
import BrowsePager from '../../../../../../common/pagination/BrowsePager.jsx';
import Translator from '../../../../../../../i18n/Translator.js';
import ExchangeDetailPane from '../shared/ExchangeDetailPane.jsx';

/**
 * Rendering helper for the treasure exchange modal's Buy tab: the paginated browse list of a
 * game's catalog treasures (with the `available_units` badge), and — once an entry is selected —
 * a two-column view keeping that list visible on the left while the shared
 * {@link ExchangeDetailPane} renders on the right.
 */
export default class BuyTreasureTabHelper {
  /**
   * Renders the Buy tab body.
   *
   * @param {object} state - Tab state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`). Items may carry `available_units` (`int|null`), shown as an
   *   always-visible badge (even at 0/1) when not `null`/`undefined`.
   * @param {object|null} state.selected - Currently selected browse item, or null.
   * @param {number} state.quantity - Quantity to buy for the selected item.
   * @param {boolean} state.submitting - Whether a buy request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.partialNotice] - Translated note shown above the browse list when the
   *   last buy request was only partially fulfilled.
   * @param {object} state.ownedByTreasureId - Map of treasure id to owned quantity.
   * @param {string} [state.gameType] - Currency model name (e.g. `dnd`, `deadlands`).
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} handlers - Tab event handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onQuantityChange`, `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Buy tab body.
   */
  static render(state, handlers) {
    const { selected } = state;

    if (!selected) {
      return BuyTreasureTabHelper.#renderBrowsePane(state, handlers);
    }

    const treasureId = selected.id;
    const owned = state.ownedByTreasureId[treasureId] ?? 0;

    return (
      <div className="row">
        <div className="col-6">{BuyTreasureTabHelper.#renderBrowsePane(state, handlers)}</div>
        <div className="col-6">
          <ExchangeDetailPane
            selected={selected}
            quantity={state.quantity}
            owned={owned}
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
        {BuyTreasureTabHelper.#renderPartialNotice(state.partialNotice)}
        {BuyTreasureTabHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {BuyTreasureTabHelper.#renderBrowseList(state, handlers)}
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

  static #renderPartialNotice(partialNotice) {
    if (!partialNotice) {
      return null;
    }

    return <div className="alert alert-info">{partialNotice}</div>;
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
            <span className="d-flex align-items-center">
              {BuyTreasureTabHelper.#renderAvailabilityBadge(item)}
              <span className="text-muted"><TreasureMoney value={item.value} gameType={gameType} /></span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  static #renderAvailabilityBadge(item) {
    if (item.available_units === null || item.available_units === undefined) {
      return null;
    }

    const label = Translator.t('treasure_exchange_modal.available_units_badge')
      .replace('{{available}}', item.available_units);

    return <span className="badge bg-secondary me-2">{label}</span>;
  }
}
