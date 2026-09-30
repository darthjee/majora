import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game recipe edit page (issue #1449), mirroring
 * `CommonItemEditHelper` minus the photo.
 */
export default class RecipeEditHelper {
  /**
   * Render the recipe edit form through `ShowPageLayout`.
   *
   * @param {object} state - Form values plus `status`, `fieldErrors`, `game_slug` and
   *   `canEditGame`.
   * @param {object} handlers - Event handlers (`onSubmit` plus the field change handlers).
   * @returns {React.ReactElement} Rendered recipe edit form.
   */
  static render(state, handlers) {
    return <ShowPageLayout type="recipe" mode="edit" context={{ ...state, handlers }} />;
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('recipe_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
