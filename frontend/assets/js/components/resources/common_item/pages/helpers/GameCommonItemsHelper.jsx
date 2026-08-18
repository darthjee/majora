import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Common Items listing page (issue #826), mirroring
 * `GamePossessionsHelper`.
 */
export default class GameCommonItemsHelper {
  /**
   * Render the common items page: header (back button, "Create Common Item" action gated on
   * `state.canCreateCommonItem`, heading) and the shared `ListPage` grid (type `commonItems`).
   * The list itself has no per-row edit/upload actions; common item creation is the only
   * DM/admin/staff-gated action on this page.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the common items list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new common item form.
   * @param {boolean} state.canCreateCommonItem - Whether the current user may create a new
   *   common item.
   * @returns {React.ReactElement} Rendered common items page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GameCommonItemsHelper.#renderNewButton(state)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_common_items_page.title')}</h1>
        </div>
        <ListPage
          type="commonItems"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_common_items_page.loading')}
        />
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canCreateCommonItem) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_common_items_page.create_common_item')}
      </NewButton>
    );
  }
}
