import React from 'react';
import BrowsePager from '../../../../../../common/pagination/BrowsePager.jsx';
import CardRecipeImage from '../../../../../../common/cards/CardRecipeImage.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Render the browse list body: loading, error, empty, or the selectable recipe entries (output
 * thumbnail, name, and a hidden badge on the restricted variants' hidden entries).
 *
 * @param {object} browse - Browse state (`items`, `loading`, `error`).
 * @param {Function} onSelect - Called with the clicked entry.
 * @returns {React.ReactElement} Browse list body.
 */
function renderBrowseList(browse, onSelect) {
  if (browse.loading) {
    return <p className="text-muted">{Translator.t('recipe_exchange_modal.loading')}</p>;
  }

  if (browse.error) {
    return <div className="alert alert-danger">{Translator.t(browse.error)}</div>;
  }

  if (browse.items.length === 0) {
    return <p className="text-muted">{Translator.t('recipe_exchange_modal.empty')}</p>;
  }

  return (
    <div className="list-group mb-3">
      {browse.items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center gap-2"
          onClick={() => onSelect(item)}
        >
          <span style={{ width: '32px' }}><CardRecipeImage url={item.output?.photo_path} alt={item.name} /></span>
          <span className="flex-grow-1 text-start">{item.name}</span>
          {item.hidden && (
            <span className="badge text-bg-secondary">{Translator.t('recipe_exchange_modal.hidden_label')}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Browse pane shared by the recipe exchange modal's Acquire and Remove tabs (issue #1450): the
 * `?name=` search input, the pager, and the selectable recipe list.
 *
 * @param {object} props - Component props.
 * @param {object} props.state - Tab state (`browse`, `search`).
 * @param {object} props.handlers - Tab handlers (`onSearchChange`, `onPrev`, `onNext`,
 *   `onSelect`).
 * @returns {React.ReactElement} Browse pane.
 */
export default function RecipeExchangeBrowsePane({ state, handlers }) {
  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder={Translator.t('recipe_exchange_modal.search_placeholder')}
        value={state.search ?? ''}
        onChange={(event) => handlers.onSearchChange(event.target.value)}
      />
      <BrowsePager browse={state.browse} onPrev={handlers.onPrev} onNext={handlers.onNext} />
      {renderBrowseList(state.browse, handlers.onSelect)}
    </>
  );
}
