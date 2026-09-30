import React from 'react';
import CardRecipeImage from '../../../../../../common/cards/CardRecipeImage.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Detail pane shared by the recipe exchange modal's Acquire and Remove tabs (issue #1450): the
 * selected recipe's output image and name, the action error (if any) and the Confirm/Cancel
 * buttons. Renders nothing while no entry is selected.
 *
 * @param {object} props - Component props.
 * @param {object|null} props.selected - Selected recipe entry (`name`, `output`), or null.
 * @param {boolean} props.submitting - Whether a submit is in flight.
 * @param {string} props.actionError - Translation key of the current action error, if any.
 * @param {object} props.handlers - Tab handlers (`onConfirm`, `onCancel`).
 * @returns {React.ReactElement|null} Detail pane, or null without a selection.
 */
export default function RecipeExchangeDetailPane({
  selected, submitting, actionError, handlers,
}) {
  if (!selected) {
    return null;
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <div style={{ width: '96px' }}>
          <CardRecipeImage url={selected.output?.photo_path} alt={selected.name} />
        </div>
        <div className="ms-3">
          <h5>{selected.name}</h5>
        </div>
      </div>
      {actionError && <div className="alert alert-danger">{Translator.t(actionError)}</div>}
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-primary" onClick={handlers.onConfirm} disabled={submitting}>
          {Translator.t('recipe_exchange_modal.confirm')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
          {Translator.t('recipe_exchange_modal.cancel_selection')}
        </button>
      </div>
    </div>
  );
}
