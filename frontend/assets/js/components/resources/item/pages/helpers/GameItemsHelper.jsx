import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Items listing page.
 */
export default class GameItemsHelper {
  /**
   * Render the items page: header (back button, "Create Item" action gated on
   * `state.canCreateItem`, heading) and the shared `ListPage` grid (type `items`). The list
   * itself has no per-row edit/upload actions; item creation (issue #784) is the only DM/admin/
   * staff-gated action on this page.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the items list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new item form.
   * @param {boolean} state.canCreateItem - Whether the current user may create a new item.
   * @returns {React.ReactElement} Rendered items page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameItemsHelper.#renderNewButton(state)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_items_page.title')}</h1>
        </div>
        <ListPage
          type="items"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_items_page.loading')}
        />
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canCreateItem) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_items_page.create_item')}
      </NewButton>
    );
  }
}
