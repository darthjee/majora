import Modal from 'react-bootstrap/cjs/Modal.js';
import TwoColumnLayout from '../../../../../common/layout/TwoColumnLayout.jsx';
import BrowsePager from '../../../../../common/pagination/BrowsePager.jsx';
import DocumentReceivingRowHelper from './DocumentReceivingRowHelper.jsx';
import Noop from '../../../../../../utils/Noop.js';
import Translator from '../../../../../../i18n/Translator.js';

const TABS = ['pcs', 'npcs'];

/**
 * Rendering helper for the give-document modal (issue #1005): a PC/NPC tab + search + browse-list
 * left pane, and (once at least one character has been picked) a right-side "receiving" list, laid
 * out through the shared {@link TwoColumnLayout} component. The receiving list collapses back to a
 * single column automatically whenever it becomes empty (either by removing the last row, or on
 * `Clear`), matching `TwoColumnLayout`'s own `detailPane` contract. Unlike
 * `GiveTreasureModalHelper`, there is no remaining-pool header badge — `CharacterDocument`
 * ownership carries no quantity concept.
 */
export default class GiveDocumentModalHelper {
  /**
   * Renders the give-document modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {string} state.activeTab - Currently active browse tab (`'pcs'` or `'npcs'`).
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`, `loading`,
   *   `error`).
   * @param {string} state.search - Current search term, bound to the browse pane's search input.
   * @param {object[]} state.receiving - Right-side receiving list.
   * @param {boolean} state.submitting - Whether a submit is in flight.
   * @param {object} handlers - Modal event handlers (`onTabChange`, `onSearchChange`, `onPrev`,
   *   `onNext`, `onSelectCharacter`, `onRemove`, `onSubmit`, `onClear`, `onClose`).
   * @returns {React.ReactElement} Rendered give-document modal.
   */
  static render(show, state, handlers) {
    const onHide = state.submitting ? Noop.noop : handlers.onClose;

    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton={!state.submitting}>
          <Modal.Title>{Translator.t('give_document_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TwoColumnLayout
            browsePane={GiveDocumentModalHelper.#renderBrowsePane(state, handlers)}
            detailPane={GiveDocumentModalHelper.#renderDetailPane(state, handlers)}
          />
        </Modal.Body>
        <Modal.Footer>
          {GiveDocumentModalHelper.#renderFooter(state, handlers)}
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderFooter(state, handlers) {
    const { submitting, receiving } = state;

    return (
      <>
        <button type="button" className="btn btn-secondary" onClick={handlers.onClear} disabled={submitting}>
          {Translator.t('give_document_modal.clear')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handlers.onClose} disabled={submitting}>
          {Translator.t('give_document_modal.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlers.onSubmit}
          disabled={submitting || receiving.length === 0}
        >
          {Translator.t('give_document_modal.submit')}
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
        {receiving.map((row) => DocumentReceivingRowHelper.render(row, handlers))}
      </div>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {GiveDocumentModalHelper.#renderTabs(state.activeTab, handlers.onTabChange)}
        {GiveDocumentModalHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {GiveDocumentModalHelper.#renderBrowseList(state, handlers)}
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
              {Translator.t(`give_document_modal.${tab === 'pcs' ? 'pc_tab' : 'npc_tab'}`)}
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
        placeholder={Translator.t('give_document_modal.search_placeholder')}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    );
  }

  static #renderBrowseList(state, handlers) {
    const { browse } = state;

    if (browse.loading) {
      return <p className="text-muted">{Translator.t('give_document_modal.loading')}</p>;
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
