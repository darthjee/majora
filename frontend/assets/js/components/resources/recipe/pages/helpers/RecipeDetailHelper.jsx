import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game recipe detail page (issue #1449), mirroring
 * `CommonItemDetailHelper` minus the photo upload.
 */
export default class RecipeDetailHelper {
  /**
   * Render the recipe detail view through `ShowPageLayout` (`recipe` show type).
   *
   * @param {object} recipe - Recipe data object (`GameRecipe` shape).
   * @param {object} links - Page links and context.
   * @param {string} links.gameSlug - Current game slug, exposed to slots as `game_slug`.
   * @param {string} links.backHref - Hash path to the recipes list.
   * @param {string} links.editHref - Hash path to the recipe's edit page.
   * @param {boolean} [canEdit] - Whether the current user may edit this recipe, gating the Edit
   *   button. Defaults to `false`.
   * @returns {React.ReactElement} Recipe detail element.
   */
  static render(recipe, links, canEdit = false) {
    return (
      <ShowPageLayout
        type="recipe"
        mode="show"
        backHref={links.backHref}
        pageActions={RecipeDetailHelper.#renderPageActions(links.editHref, canEdit)}
        context={{ ...recipe, game_slug: links.gameSlug }}
      />
    );
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

  static #renderPageActions(editHref, canEdit) {
    return (
      <ConditionalComponent render={canEdit}>
        <EditButton href={editHref}>{Translator.t('recipe_page.edit_button')}</EditButton>
      </ConditionalComponent>
    );
  }
}
