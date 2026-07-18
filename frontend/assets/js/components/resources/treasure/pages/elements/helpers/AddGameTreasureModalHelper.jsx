import Modal from 'react-bootstrap/cjs/Modal.js';
import CardTreasureImage from '../../../../../common/cards/CardTreasureImage.jsx';
import TreasureMoney from '../../../../../common/misc/TreasureMoney.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the Add Treasure modal shell: the paginated browse list of catalog
 * treasures missing from the game, and the selected-treasure detail/form.
 */
export default class AddGameTreasureModalHelper {
  /**
   * Renders the Add Treasure modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`).
   * @param {object|null} state.selected - Currently selected browse item, or null.
   * @param {{value: string, hidden: boolean, hasMaxUnits: boolean, maxUnits: string}}
   *   state.formState - Current form state for the selected treasure.
   * @param {boolean} state.submitting - Whether a link request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {object} handlers - Modal event handlers (`onClose`, `onSelect`, `onBack`, `onPrev`,
   *   `onNext`, `onValueChange`, `onHiddenChange`, `onHasMaxUnitsChange`, `onMaxUnitsChange`,
   *   `onSubmit`).
   * @returns {React.ReactElement} Rendered Add Treasure modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('add_game_treasure_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {state.selected
            ? AddGameTreasureModalHelper.#renderDetail(state, handlers)
            : AddGameTreasureModalHelper.#renderBrowsePane(state, handlers)}
        </Modal.Body>
        <Modal.Footer>
          {AddGameTreasureModalHelper.#renderActionError(state.actionError)}
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t('treasure_exchange_modal.cancel')}
          </button>
          {state.selected && AddGameTreasureModalHelper.#renderSaveButton(state, handlers)}
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderSaveButton(state, handlers) {
    return (
      <button type="button" className="btn btn-primary" onClick={handlers.onSubmit} disabled={state.submitting}>
        {Translator.t('add_game_treasure_modal.save')}
      </button>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {AddGameTreasureModalHelper.#renderPager(state.browse, handlers)}
        {AddGameTreasureModalHelper.#renderBrowseList(state.browse, handlers.onSelect)}
      </>
    );
  }

  static #renderPager(browse, handlers) {
    if (browse.pages <= 1) {
      return null;
    }

    return (
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={handlers.onPrev}
          disabled={browse.page <= 1}
        >
          {Translator.t('pagination.previous')}
        </button>
        <span>{`${browse.page} / ${browse.pages}`}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={handlers.onNext}
          disabled={browse.page >= browse.pages}
        >
          {Translator.t('pagination.next')}
        </button>
      </div>
    );
  }

  static #renderBrowseList(browse, onSelect) {
    if (browse.loading) {
      return <p className="text-muted">{Translator.t('treasure_exchange_modal.loading')}</p>;
    }

    if (browse.error) {
      return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
    }

    if (browse.items.length === 0) {
      return <p className="text-muted">{Translator.t('add_game_treasure_modal.empty')}</p>;
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
            <span className="text-muted"><TreasureMoney value={item.value} gameType={item.game_type} /></span>
          </button>
        ))}
      </div>
    );
  }

  static #renderDetail(state, handlers) {
    const { selected, formState } = state;

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
            <p className="mb-0"><TreasureMoney value={selected.value} gameType={selected.game_type} /></p>
          </div>
        </div>
        {AddGameTreasureModalHelper.#renderForm(formState, handlers)}
      </div>
    );
  }

  static #renderForm(formState, handlers) {
    return (
      <>
        <div className="mb-3">
          <label className="form-label" htmlFor="add-game-treasure-value">
            {Translator.t('add_game_treasure_modal.value_label')}
          </label>
          <input
            id="add-game-treasure-value"
            type="number"
            className="form-control"
            value={formState.value}
            onChange={(event) => handlers.onValueChange(event.target.value)}
          />
        </div>
        <div className="form-check form-switch mb-3">
          <input
            id="add-game-treasure-hidden"
            type="checkbox"
            role="switch"
            className="form-check-input"
            checked={formState.hidden}
            onChange={(event) => handlers.onHiddenChange(event.target.checked)}
          />
          <label htmlFor="add-game-treasure-hidden" className="form-check-label">
            {Translator.t('game_treasures_page.hidden_label')}
          </label>
        </div>
        <div className="form-check form-switch mb-3">
          <input
            id="add-game-treasure-has-max-units"
            type="checkbox"
            role="switch"
            className="form-check-input"
            checked={formState.hasMaxUnits}
            onChange={(event) => handlers.onHasMaxUnitsChange(event.target.checked)}
          />
          <label htmlFor="add-game-treasure-has-max-units" className="form-check-label">
            {Translator.t('add_game_treasure_modal.max_units_label')}
          </label>
        </div>
        {AddGameTreasureModalHelper.#renderMaxUnitsField(formState, handlers)}
      </>
    );
  }

  static #renderMaxUnitsField(formState, handlers) {
    if (!formState.hasMaxUnits) {
      return null;
    }

    return (
      <input
        id="add-game-treasure-max-units"
        type="number"
        className="form-control mb-3"
        aria-label={Translator.t('add_game_treasure_modal.max_units_label')}
        value={formState.maxUnits}
        onChange={(event) => handlers.onMaxUnitsChange(event.target.value)}
      />
    );
  }

  static #renderActionError(actionError) {
    if (!actionError) {
      return null;
    }

    return <div className="alert alert-danger w-100 mb-2">{Translator.t(actionError)}</div>;
  }
}
