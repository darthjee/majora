import Modal from 'react-bootstrap/cjs/Modal.js';
import CardTreasureImage from '../../../../../common/cards/CardTreasureImage.jsx';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import BrowsePager from '../../../../../common/pagination/BrowsePager.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Resolve the tab-dependent detail values (owned treasure id, quantity already
 * owned, and the sell-tab max quantity) for the currently selected treasure.
 *
 * @param {object} state - Modal state (see {@link TreasureExchangeModalHelper#render}).
 * @param {string} state.activeTab - Currently active tab (`acquire` or `sell`).
 * @param {object} state.selected - Currently selected browse item.
 * @param {object} state.ownedByTreasureId - Map of treasure id to owned quantity.
 * @returns {{treasureId: number, owned: number, maxQuantity: number|undefined}} Resolved
 *   detail values for the active tab.
 */
export function resolveDetailValues({ activeTab, selected, ownedByTreasureId }) {
  const treasureId = activeTab === 'acquire' ? selected.id : selected.treasure_id;
  const owned = activeTab === 'acquire' ? (ownedByTreasureId[treasureId] ?? 0) : selected.quantity;
  const maxQuantity = activeTab === 'sell' ? selected.quantity : undefined;

  return { treasureId, owned, maxQuantity };
}

/**
 * Renders the treasure exchange modal shell: the Acquire/Sell tabs, the
 * paginated browse list, and the selected-treasure detail/quantity form.
 */
export default class TreasureExchangeModalHelper {
  /**
   * Renders the treasure exchange modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string} state.activeTab - Currently active tab (`acquire` or `sell`).
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`). Acquire-tab items may carry `available_units` (`int|null`), shown
   *   as an always-visible badge (even at 0/1) when not `null`/`undefined`.
   * @param {object|null} state.selected - Currently selected browse item, or null.
   * @param {number} state.quantity - Quantity to acquire/sell for the selected item.
   * @param {boolean} state.submitting - Whether an acquire/sell request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.partialNotice] - Translated note shown above the browse list when
   *   the last acquire request was only partially fulfilled.
   * @param {object} state.ownedByTreasureId - Map of treasure id to owned quantity.
   * @param {string} [state.gameType] - Currency model name (e.g. `dnd`, `deadlands`) used to
   *   render browsed/selected treasure values. Defaults to `dnd`.
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} [state.character] - Character context (`money`), used to render the
   *   character's current money at the top of the modal.
   * @param {object} handlers - Modal event handlers (`onClose`, `onTabChange`, `onSelect`,
   *   `onBack`, `onPrev`, `onNext`, `onQuantityChange`, `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered treasure exchange modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('treasure_exchange_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {TreasureExchangeModalHelper.#renderMoney(state.character, state.gameType)}
          {TreasureExchangeModalHelper.#renderTabs(state.activeTab, handlers.onTabChange)}
          {state.selected
            ? TreasureExchangeModalHelper.#renderDetail(state, handlers)
            : TreasureExchangeModalHelper.#renderBrowsePane(state, handlers)}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t('treasure_exchange_modal.cancel')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderMoney(character, gameType) {
    if (!character) {
      return null;
    }

    return (
      <p className="mb-3">
        <strong>{Translator.t('treasure_exchange_modal.your_money')}</strong>
        {' '}
        <TreasureMoney value={character.money} gameType={gameType} />
      </p>
    );
  }

  static #renderTabs(activeTab, onTabChange) {
    return (
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'acquire' ? 'active' : ''}`}
            onClick={() => onTabChange('acquire')}
          >
            {Translator.t('treasure_exchange_modal.acquire_tab')}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => onTabChange('sell')}
          >
            {Translator.t('treasure_exchange_modal.sell_tab')}
          </button>
        </li>
      </ul>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {TreasureExchangeModalHelper.#renderPartialNotice(state.partialNotice)}
        {TreasureExchangeModalHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {TreasureExchangeModalHelper.#renderBrowseList(
          state.browse, state.activeTab, state.gameType, handlers.onSelect
        )}
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

  static #renderBrowseList(browse, activeTab, gameType, onSelect) {
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
            onClick={() => onSelect(item)}
          >
            <span>{item.name}</span>
            <span className="d-flex align-items-center">
              {activeTab === 'acquire' && TreasureExchangeModalHelper.#renderAvailabilityBadge(item)}
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

  static #renderDetail(state, handlers) {
    const { selected, quantity, submitting, actionError, gameType } = state;
    const { owned, maxQuantity } = resolveDetailValues(state);

    return (
      <div>
        <button type="button" className="btn btn-link p-0 mb-2" onClick={handlers.onBack}>
          {Translator.t('treasure_exchange_modal.back')}
        </button>
        <div className="d-flex align-items-center mb-3">
          <div style={{ width: '96px' }}>
            <CardTreasureImage url={selected.photo_path} alt={selected.name} />
          </div>
          <div className="ms-3">
            <h5>{selected.name}</h5>
            <p className="mb-1"><TreasureMoney value={selected.value} gameType={gameType} /></p>
            <p className="text-muted mb-0">
              {Translator.t('treasure_exchange_modal.already_owned').replace('{{quantity}}', owned)}
            </p>
          </div>
        </div>
        {TreasureExchangeModalHelper.#renderActionError(actionError)}
        <div className="mb-3">
          <label className="form-label" htmlFor="treasure-exchange-quantity">
            {Translator.t('treasure_exchange_modal.quantity_label')}
          </label>
          <input
            id="treasure-exchange-quantity"
            type="number"
            min="1"
            max={maxQuantity}
            className="form-control"
            value={quantity}
            onChange={(event) => handlers.onQuantityChange(Number(event.target.value))}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={handlers.onConfirm} disabled={submitting}>
          {Translator.t('treasure_exchange_modal.confirm')}
        </button>
      </div>
    );
  }

  static #renderActionError(actionError) {
    if (!actionError) {
      return null;
    }

    return <div className="alert alert-danger">{Translator.t(actionError)}</div>;
  }
}
