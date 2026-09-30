import React from 'react';
import TwoColumnLayout from '../../../../../../common/layout/TwoColumnLayout.jsx';
import RecipeExchangeBrowsePane from '../shared/RecipeExchangeBrowsePane.jsx';
import RecipeExchangeDetailPane from '../shared/RecipeExchangeDetailPane.jsx';

/**
 * Rendering helper for the recipe exchange modal's Remove tab (issue #1450): the browse list on
 * the left and, once an entry is selected, its detail pane (Confirm/Cancel) on the right.
 */
export default class RemoveRecipeTabHelper {
  /**
   * Renders the Remove tab body.
   *
   * @param {object} state - Tab state (`browse`, `selected`, `submitting`, `actionError`,
   *   `search`).
   * @param {object} handlers - Tab handlers (`onSelect`, `onCancel`, `onPrev`, `onNext`,
   *   `onConfirm`, `onSearchChange`).
   * @returns {React.ReactElement} Rendered Remove tab body.
   */
  static render(state, handlers) {
    return (
      <TwoColumnLayout
        browsePane={<RecipeExchangeBrowsePane state={state} handlers={handlers} />}
        detailPane={state.selected ? <RecipeExchangeDetailPane {...state} handlers={handlers} /> : null}
      />
    );
  }
}
