import CardFactionImage from '../../../../../../common/cards/CardFactionImage.jsx';
import BrowsePager from '../../../../../../common/pagination/BrowsePager.jsx';
import TwoColumnLayout from '../../../../../../common/layout/TwoColumnLayout.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

function renderActionError(actionError) {
  if (!actionError) {
    return null;
  }

  return <div className="alert alert-danger">{Translator.t(actionError)}</div>;
}

/**
 * Rendering helper for the faction exchange modal's Enlist tab (issue #943): the paginated browse
 * list of a game's Enlist catalog (already excluding enlisted factions), and — once an entry is
 * selected — a two-column view keeping that list visible on the left while a detail pane (image,
 * name, and the Confirm/Cancel buttons) renders on the right. No quantity input and no "hidden"
 * switch — mirrors `AcquireDocumentTabHelper`, minus the switch (see `AcquireFactionTab`'s own
 * description for why).
 */
export default class AcquireFactionTabHelper {
  /**
   * Renders the Enlist tab body.
   *
   * @param {object} state - Tab state.
   * @param {object} state.browse - Current browse page state (`items`, `page`, `pages`,
   *   `loading`, `error`).
   * @param {object|null} state.selected - Currently selected browse item, or null.
   * @param {boolean} state.submitting - Whether an acquire request is in flight.
   * @param {string} state.actionError - Translation key for the current action error, if any.
   * @param {string} [state.search] - Current search term, bound to the browse pane's search input.
   * @param {object} handlers - Tab event handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Enlist tab body.
   */
  static render(state, handlers) {
    const { selected } = state;

    return (
      <TwoColumnLayout
        browsePane={AcquireFactionTabHelper.#renderBrowsePane(state, handlers)}
        detailPane={selected ? AcquireFactionTabHelper.#renderDetailPane(state, handlers) : null}
      />
    );
  }

  static #renderDetailPane(state, handlers) {
    const { selected, submitting, actionError } = state;

    return (
      <div>
        <div className="d-flex align-items-center mb-3">
          <div style={{ width: '96px' }}>
            <CardFactionImage url={selected.photo_path} alt={selected.name} />
          </div>
          <div className="ms-3">
            <h5>{selected.name}</h5>
          </div>
        </div>
        {renderActionError(actionError)}
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary" onClick={handlers.onConfirm} disabled={submitting}>
            {Translator.t('faction_exchange_modal.confirm')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
            {Translator.t('faction_exchange_modal.cancel_selection')}
          </button>
        </div>
      </div>
    );
  }

  static #renderBrowsePane(state, handlers) {
    return (
      <>
        {AcquireFactionTabHelper.#renderSearchInput(state.search, handlers.onSearchChange)}
        <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
        {AcquireFactionTabHelper.#renderBrowseList(state, handlers)}
      </>
    );
  }

  static #renderSearchInput(search, onSearchChange) {
    return (
      <input
        type="text"
        className="form-control mb-3"
        placeholder={Translator.t('faction_exchange_modal.search_placeholder')}
        value={search ?? ''}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    );
  }

  static #renderBrowseList(state, handlers) {
    const { browse } = state;

    if (browse.loading) {
      return <p className="text-muted">{Translator.t('faction_exchange_modal.loading')}</p>;
    }

    if (browse.error) {
      return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
    }

    if (browse.items.length === 0) {
      return <p className="text-muted">{Translator.t('faction_exchange_modal.empty')}</p>;
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
