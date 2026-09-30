import React from 'react';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';

/**
 * Rendering helper for the game recipe creation page (issue #1449), a thin wrapper around the
 * `recipe`/`new` `showTypeConfig` entry, mirroring `GameCommonItemNewHelper`.
 */
export default class GameRecipeNewHelper {
  /**
   * Render the recipe creation form through `ShowPageLayout`.
   *
   * @param {object} formState - Form values plus `status`, `fieldErrors`, `game_slug` and
   *   `canEditGame`.
   * @param {object} handlers - Event handlers (`onSubmit` plus the field change handlers).
   * @returns {React.ReactElement} Rendered new recipe page.
   */
  static render(formState, handlers) {
    return <ShowPageLayout type="recipe" mode="new" context={{ ...formState, handlers }} />;
  }
}
