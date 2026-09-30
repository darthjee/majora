import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Recipes listing page (issue #1449), mirroring
 * `GameCommonItemsHelper`.
 */
export default class GameRecipesHelper {
  /**
   * Render the recipes page: header (back button, "New Recipe" action gated on
   * `state.canCreateRecipe`, heading), the shared `ListPage` grid (type `recipes`, with its
   * category filter bar) and the empty-state message.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the recipes list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new recipe form.
   * @param {boolean} state.canCreateRecipe - Whether the current user may create a recipe.
   * @param {object} state.activeFilters - Active filter query params preserved on pagination links.
   * @param {number} state.refreshToken - Opaque value bumped to re-trigger the list fetch.
   * @param {number|null} state.itemsCount - Number of recipes on the loaded page, or `null`
   *   while not loaded yet.
   * @param {object} handlers - Page event handlers.
   * @param {Function} handlers.onFilterQuery - Called with the built filter query.
   * @param {Function} handlers.onItemsChange - Called with the freshly fetched raw recipes.
   * @returns {React.ReactElement} Rendered recipes page.
   */
  static render(state, handlers) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameRecipesHelper.#renderNewButton(state)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_recipes_page.title')}</h1>
        </div>
        <ListPage
          type="recipes"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_recipes_page.loading')}
          filters={{ props: { onQuery: handlers.onFilterQuery }, active: state.activeFilters }}
          refreshToken={state.refreshToken}
          handlers={{ onItemsChange: handlers.onItemsChange }}
        />
        {GameRecipesHelper.#renderEmpty(state)}
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canCreateRecipe) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_recipes_page.new_button')}
      </NewButton>
    );
  }

  static #renderEmpty(state) {
    if (state.itemsCount !== 0) {
      return null;
    }

    return (
      <div className="container">
        <p className="text-muted" data-testid="recipes-empty">{Translator.t('game_recipes_page.empty')}</p>
      </div>
    );
  }
}
