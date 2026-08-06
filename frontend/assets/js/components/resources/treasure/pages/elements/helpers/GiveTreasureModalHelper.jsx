import Modal from 'react-bootstrap/cjs/Modal.js';
import TwoColumnLayout from '../../../../../common/layout/TwoColumnLayout.jsx';
import BrowsePager from '../../../../../common/pagination/BrowsePager.jsx';
import TreasureReceivingRowHelper from './TreasureReceivingRowHelper.jsx';
import GiveTreasureModalController from '../controllers/GiveTreasureModalController.js';
import Noop from '../../../../../../utils/Noop.js';
import Translator from '../../../../../../i18n/Translator.js';

const TABS = ['pcs', 'npcs'];

/**
 * Rendering helper for the give-treasure modal (issue #1001): a PC/NPC tab + search + browse-list
 * left pane, and (once at least one character has been picked) a right-side "receiving" list, laid
 * out through the shared {@link TwoColumnLayout} component. The receiving list collapses back to a
 * single column automatically whenever it becomes empty (either by removing the last row, or on
 * `Clear`), matching `TwoColumnLayout`'s own `detailPane` contract. Unlike
 * `GiveItemModalHelper`, the modal header also surfaces the live remaining pool
 * (`available_units` minus every row's pending quantity) when the treasure is capped.
 */
export default class GiveTreasureModalHelper {
  /**
   * Renders the give-treasure modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string} state.activeTab - Currently active browse tab (`'pcs'` or `'npcs'`).
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`, `loading`,
   *   `error`).
   * @param {string} state.search - Current search term, bound to the browse pane's search input.
   * @param {object[]} state.receiving - Right-side receiving list.
   * @param {boolean} state.submitting - Whether a submit is in flight.
   * @param {number|null} state.availableUnits - Live pool cap across every receiving row, or
   *   `null` for unlimited.
   * @param {object} handlers - Modal event handlers (`onTabChange`, `onSearchChange`, `onPrev`,
   *   `onNext`, `onSelectCharacter`, `onIncrement`, `onDecrement`, `onRemove`, `onSubmit`,
   *   `onClear`, `onClose`).
   * @returns {React.ReactElement} Rendered give-treasure modal.
   */
  static render(show, state, handlers) {
    const onHide = state.submitting ? Noop.noop : handlers.onClose;

    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton={!state.submitting}>
          <Modal.Title>{Translator.t('give_treasure_modal.title')}</Modal.Title>
          {GiveTreasureModalHelper.#renderRemaining(state.availableUnits, state.receiving)}
        </Modal.Header>
        <Modal.Body>
          <TwoColumnLayout
            browsePane={GiveTreasureModalHelper.#renderBrowsePane(state, handlers)}
            detailPane={GiveTreasureModalHelper.#renderDetailPane(state, handlers)}
          />
        </Modal.Body>
        <Modal.Footer>
          {GiveTreasureModalHelper.#renderFooter(state, handlers)}
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderRemaining(availableUnits, receiving) {
    if (availableUnits === null || availableUnits === undefined) {
      return null;
    }

    const remaining = availableUnits - GiveTreasureModalController.totalPending(receiving);
    const label = Translator.t('give_treasure_modal.remaining_units').replace('{{remaining}}', remaining);

    return <span className="badge bg-secondary ms-2">{label}</span>;
  }

  static #renderFooter(state, handlers) {
    const { submitting, receiving } = state;

    return (
      <>
        <button type="button" className="btn btn-secondary" onClick={handlers.onClear} disabled={submitting}>
          {Translator.t('give_treasure_modal.clear')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handlers.onClose} disabled={submitting}>
          {Translator.t('give_treasure_modal.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlers.onSubmit}
          disabled={submitting || receiving.length === 0}
        >
          {Translator.t('give_treasure_modal.submit')}
        </button>
      </>
    );
  }

  static #renderDetailPane(state, handlers) {
    const { receiving } = state;

    if (receiving.length === 0) {
      return null;
    }

    return (
      <div className="list-group">
        {receiving.map((row) => TreasureReceivingRowHelper.render(row, handlers))}
      </div>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {GiveTreasureModalHelper.#renderTabs(state.activeTab, handlers.onTabChange)}
        {GiveTreasureModalHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {GiveTreasureModalHelper.#renderBrowseList(state, handlers)}
      </>
    );
  }

  static #renderTabs(activeTab, onTabChange) {
    return (
      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              type="button"
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {Translator.t(`give_treasure_modal.${tab === 'pcs' ? 'pc_tab' : 'npc_tab'}`)}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  static #renderSearchInput(search, onSearchChange) {
    return (
      <input
        type="text"
        className="form-control mb-3"
        placeholder={Translator.t('give_treasure_modal.search_placeholder')}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    );
  }

  static #renderBrowseList(state, handlers) {
    const { browse } = state;

    if (browse.loading) {
      return <p className="text-muted">{Translator.t('give_treasure_modal.loading')}</p>;
    }

    if (browse.error) {
      return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
    }

    return (
      <div className="list-group mb-3">
        {browse.items.map((character) => (
          <button
            key={character.id}
            type="button"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            onClick={() => handlers.onSelectCharacter(character)}
          >
            <span>{character.name}</span>
          </button>
        ))}
      </div>
    );
  }
}
