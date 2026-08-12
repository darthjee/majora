import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import NewButton from '../../../../common/buttons/NewButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Possessions listing page (issue #1074), mirroring
 * `GameItemsHelper`.
 */
export default class GamePossessionsHelper {
  /**
   * Render the possessions page: header (back button, "Create Possession" action gated on
   * `state.canCreatePossession`, heading) and the shared `ListPage` grid (type `possessions`).
   * The list itself has no per-row edit/upload actions; possession creation is the only
   * DM/admin/staff-gated action on this page.
   *
   * @param {object} state - Page state.
   * @param {string} state.gameSlug - Current game slug.
   * @param {string} state.basePath - Base hash path for the possessions list.
   * @param {string} state.backHref - Hash path to the parent game page.
   * @param {string} state.newHref - Hash path to the new possession form.
   * @param {boolean} state.canCreatePossession - Whether the current user may create a new
   *   possession.
   * @returns {React.ReactElement} Rendered possessions page.
   */
  static render(state) {
    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={state.backHref}>
            {GamePossessionsHelper.#renderNewButton(state)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('game_possessions_page.title')}</h1>
        </div>
        <ListPage
          type="possessions"
          gameSlug={state.gameSlug}
          basePath={state.basePath}
          loadingMessage={Translator.t('game_possessions_page.loading')}
        />
      </>
    );
  }

  static #renderNewButton(state) {
    if (!state.canCreatePossession) {
      return null;
    }

    return (
      <NewButton href={state.newHref}>
        {Translator.t('game_possessions_page.create_possession')}
      </NewButton>
    );
  }
}
